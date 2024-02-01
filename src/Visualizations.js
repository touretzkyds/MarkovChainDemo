import React, {useState, useEffect, useRef} from "react";
import CytoscapeComponent from "react-cytoscapejs";
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import { useDictContext } from "./Context";
import { render } from "@testing-library/react";

cytoscape.use(dagre);

export default function Visualizations(props) {

    //Get variables needed from the shared context
    const {nGramDict, modelType, textGenMode, setTextGenMode,
           generatedText, setGeneratedText, reFormatText, generate_text,
           currentWord, setCurrentWord, key, setKey, 
           enableNextWord, setEnableNextWord, keysAdded, setKeysAdded,
           wordOptions, setWordOptions, wordCount, setWordCount,
           clearButtonClicked, setClearButtonClicked} = useDictContext();

    //State variable to check whether the current display has successfully been reset
    const [isReset, setIsReset] = useState(false);

    //Variables to store the layout, layout type, and a flag to signal whether the layout has been built
    const [layout, setLayout] = useState();
    const [layoutName, setLayoutName] = useState("preset");
    const [layoutBuilt, setLayoutBuilt] = useState(false);

    //Declare a state variable to house the graph and keep track of all added nodes
    const [graphData, setGraphData] = useState([]);
    const [nodesAdded, setNodesAdded] = useState([]);

    //Flag for whether the graph has been re-rendered at the end of text generation
    const [graphReRendered, setGraphReRendered] = useState(false);
    //Flag to determine whether the graph has finished rendering (automatic)
    const [autoGraphRendered, setAutoGraphRendered] = useState(false);

    //Set current reference of graph div to null
    let graphRef = React.useRef(null);

    //CONSTANTS FOR PANE FOUR RENDERING (maximum x and y bounds)
    //Maximum height of graph away from central axis for both successor layers (vertically and horizontally)
    const maxDeviationYL1 = -100;
    const maxDeviationXL1 = 100;
    const maxDeviationYL2 = maxDeviationYL1 - 50;
    const maxDeviationXL2 = maxDeviationXL1 + 40;
    
    //Set graph style parameters
    const graphStyle = [
        {
            //Style parameters for nodes
            selector: "node",
            style : {
                'background-color': 'white', // Node background color
                'label': 'data(label)', // Display the node's label
                'shape': 'ellipse', // Node shape
                'width': '100px', // Node width
                'height': '50px', // Node height
                'font-size': '20px', // Label font size
                'text-valign': 'center', // Vertical alignment of label
                'text-halign': 'center', // Horizontal alignment of label
                'text-wrap' : 'wrap',
                'text-max-width' : "95px",
                "color" : "black"
            }
        },
        {
            //Style parameters for edges
            selector: 'edge', // Apply the style to all edges
            style: {
                'width': 5, // Edge width
                'line-color': 'white', // Edge color
                "curve-style" : "bezier",
                'target-arrow-shape': 'triangle',
                'target-arrow-color' : 'white',
                'source-arrow-color' : 'white'
            }
        }
    ]

    // =========== ALL FUNCTIONS AND EFFECTS ===========

    // RESET FUNCTIONS

    //Declare a reset function to change all parameters back to default values upon component mount or mode change
    const resetGraph = () => {

        //Set the isReset flag to false
        setIsReset(false);

        //Reset layout and build status (name remains constant)
        setLayout();
        setLayoutBuilt(false);

        //Empty current graph and list of both added keys (stored in context) and nodes
        setGraphData([]);
        setKeysAdded([]);
        setNodesAdded([]);
        setWordOptions([]);
        setKey("");
        setCurrentWord("");

        //Set re-rendering and colour-related flags for the graph to false
        setGraphReRendered(false);
        setAutoGraphRendered(false);

        //If we are in manual mode, set the manual text to be blank
        if (textGenMode === "manual") {setManualText("")};
        
    }

    //When the component first mounts and whenever the text generation mode changes, reset the graph
    //Do so additionally when the model type changes
    useEffect(() => {
        resetGraph();
    }, [textGenMode, modelType, nGramDict])

    //Also reset the graph if the mode of generation is automatic and the generated text contant has changed
    useEffect(() => {
        if (textGenMode === "automatic") {resetGraph();}
    }, [generatedText])

    //Reset the graph additionally when the clear button in pane three has been clicked - this is only possible for manual text generation mode, but the execution is identical
    useEffect(() => {
        if (clearButtonClicked) {
            resetGraph();
            setClearButtonClicked(false);
        }
    }, [clearButtonClicked])

    //If the layout has not been yet defined or built, and the graph is currently empty, set the reset flag to true - all variables are now at their default position
    useEffect(() => {
        //Verify that the aforementioned is the case
        if (layout === undefined && layoutBuilt === false && graphData.length === 0) {
            setIsReset(true);
        }
    }, [layout, layoutBuilt, graphData, modelType])

    //Function to build graph based on dictionary
    const buildGraph = () => {

        //Set keys array
        let dictArr = Array.from(nGramDict);
        const dictKeys = dictArr.map(function (pair) {return pair[0];});

        //Pick a word from the dictionary at random, add to graph (if not already present) and added node list
        let startKey = dictKeys[Math.floor(Math.random() * dictKeys.length)];
        
        if (!startKey.split(" ").includes("undefined")) {

            //Place point at (0, 0)
            let newGraphPoint = {data : {id : reFormatText(startKey), label : reFormatText(startKey)}, position : {x:Math.random()}};
            setGraphData(existingGraph => [...existingGraph, newGraphPoint]);
            setNodesAdded(existingNodes => [...existingNodes, startKey]);
        }

        //Iterate through each successor word
        let successorsL1 = Array.from(nGramDict.get(startKey));
        successorsL1 = successorsL1.map(function (pair) {return pair[0];})

        //Current x-coordinate of L1 graph
        let xCoordinateL1 = maxDeviationXL1;
        //Y-coord of L1 graph
        let yCoordinateL1 = maxDeviationYL1;

        //Counter to keep track of vertical nodes stacked at any given time
        let counterL1 = 0;
        //Counter to keep track of the current column being rendered
        let columnCounterL1 = 0;

        //Determine successor length
        let successorLength = successorsL1.length;
        let renderSecondOrderSuccessors = successorLength > 5 ? false : true;
        let maxFirstOrderSuccessors = renderSecondOrderSuccessors ? Math.min(5, successorLength) : successorLength;

        console.log("L1 SUCCESSORS:", successorsL1);

        for (var i = 0; i < maxFirstOrderSuccessors; i++) {

            //Get value
            let unformattedSuccessor = successorsL1[i];
            let successor = reFormatText(unformattedSuccessor);
            

            //Set to starting node position + 50 and subtract by i * (50/2) until four nodes have been added; then, shift x by another 50 and repeat the process
            //Do the same for the nested loop

            //Node
            if (counterL1 % 5 == 0) {
                xCoordinateL1 += maxDeviationXL1;
                yCoordinateL1 = maxDeviationYL1;
                counterL1 = 0;

                //Increment the column counter
                columnCounterL1++;

            }

            //Determine the maximum number of nodes for this column
            //If in a column where filling all five nodes is possible, do so.
            //Otherwise, if we are on the final column, leverage the remainder
            let maxColumnNodes = 0;
            if (columnCounterL1 < (maxFirstOrderSuccessors / 5)) {maxColumnNodes = 5;}
            else if (maxFirstOrderSuccessors % 5 == 0) {maxColumnNodes = 5;}
            else {maxColumnNodes = maxFirstOrderSuccessors % 5;}

            yCoordinateL1 += (Math.abs(maxDeviationYL1) * 2 / (maxColumnNodes + 1));

            let newGraphPoint = {data : {id : successor, label : successor}, position : {x : xCoordinateL1, y: yCoordinateL1}};
            counterL1++;
            setGraphData(existingGraph => [...existingGraph, newGraphPoint]);
            setNodesAdded(existingNodes => [...existingNodes, successor]);

            //Now, generate the successors of each subtree (if required)
            if (!renderSecondOrderSuccessors) {continue;}
            let successorsL2 = Array.from(nGramDict.get(unformattedSuccessor));

            successorsL2 = successorsL2.map(function (pair) {return pair[0];});

            let xCoordinateL2 = maxDeviationXL2*3;
            let yCoordinateL2 = maxDeviationYL2;
            let counterL2 = 0;
            let columnCounterL2 = 0;

            console.log("L2 SUCCESSORS FOR " + successor + ":", successorsL2);

            for (var j = 0; j < successorsL2.length; j++) {

                //Get successor word
                let successorL2 = reFormatText(successorsL2[j]);

                if (counterL2 % 2 == 0 && counterL2 != 0) {
                    xCoordinateL2 += maxDeviationXL2;
                    yCoordinateL2 = maxDeviationYL2
                    counterL2 = 0;

                    //Incremenet second order column counter
                    columnCounterL2++;
                }

                let maxColumnNodesL2 = 0;
                if (columnCounterL2 < (successorL2.length / 2)) {
                    maxColumnNodesL2 = 2;
                }
                else if (successorL2.length % 2 == 0) {maxColumnNodesL2 = 2;}
                else {
                    maxColumnNodesL2 = successorL2.length % 2;
                }
                // let maxColumnNodesL2 = columnCounterL2 < (successorsL2.length / 2) ? 2 : successorL2.length % 2;
                yCoordinateL2 += (Math.abs(yCoordinateL1 - 35) * 2) / (maxColumnNodesL2 + 1);

                //Add to graph (whether the successor has already been included or not is of no consequence)
                let newGraphPointL2 = {data : {id : successorL2, label : successorL2}, position : {x: xCoordinateL2, y : yCoordinateL2}};
                setGraphData(existingGraph => [...existingGraph, newGraphPointL2]);
                counterL2++;

                //Branch
                // let newBranchL2 = {data : {source : successor, target : successorL2, label : successor + successorL2}};
                // setGraphData(existingGraph => [...existingGraph, newBranchL2]);

            }
        }
    }

    //Check continuously for whether the graph has been reset, the key has changed, or potential word choices have been updated
    //If any of the above are true, the key is NOT blank (i.e. it has been chosen), and the graph has successfully been reset, re-render the graph
    //Simultaneously, re-define the layout.
    useEffect(() => {
        //Verify reset and key selection, as well as the fact that previous key options have all been removed
        if (isReset) {
            //Build the graph
            buildGraph();
            //Set the graph's layout
            setLayout({
                name: layoutName,
                fit: true,
                rankDir: "LR",
                directed: false,
                circle: true,
                // grid: false,
                avoidOverlap: true,
                spacingFactor: 1.5 + Math.random() * (1.8 - 1.5),
                nodeDimensionsIncludeLabels: true,
               //boundingBox: {x1 : 0, y1 : 0, x2 : 500, y2: 500},
                animate: true,
                gravity : 1,
                randomize: false,
                ready: true,
                stop: true,
                klay : {
                    addUnnecessaryBendpoints: false,
                    mergeHierarchyCrossingEdges: false,
                    direction : "RIGHT",
                    // crossingMinimization: "INTERACTIVE",
                    feedbackEdges: true,
                    mergeEdges : true,
                    //nodePlacement : "LINEAR_SEGMENTS"
                }
            });
        }
    }, [isReset, wordOptions])

    //Check for when the layout is no longer undefined (that is, it has been rendered) and update accordingly
    useEffect(() => {
        if (layout !== undefined) {
            setLayoutBuilt(true);
        }
    }, [layout])

    return (
        <div className = "visualizations" class = "flex flex-col space-y-2 h-full w-full items-center justify-center rounded-md bg-zinc-50 drop-shadow-md">
            <div className = "panel-4-header" class = "flex flex-row h-fit w-11/12 align-center items-center justify-center space-x-4">
                <p className = "text-entrance-text" class = "flex-auto font-bold monitor:text-lg 2xl:text-sm xl:text-sm sm:text-xs">[4] Visualize {modelType}.</p>
                <div className = "instructions" class = "flex flex-col justify-end items-right text-right w-1/2 h-full">
                    <p className = "instruction1" class = "flex-auto monitor:text-base 2xl:text-sm xl:text-sm sm:text-xs">Mouse wheel / trackpad to zoom.</p>
                    <p className = "instruction1" class = "flex-auto monitor:text-base 2xl:text-sm xl:text-sm sm:text-xs">Left button to pan (click and drag).</p>
                </div>
            </div>
            <div id = "cyto-frame" className = "visualization-graph" class = "flex w-11/12 h-5/6 bg-white rounded-md">
                {layoutBuilt && <CytoscapeComponent className = "graph" id = "graph" class = "h-full w-full" stylesheet = {graphStyle} elements = {graphData} layout = {layout} style = {{width : '100%', height : "100%"}} ref = {graphRef}/>}
                {!layoutBuilt && <div className = "loading" class = "flex h-full w-full text-center align-center items-center justify-center">Loading...</div>}
                {/* <div className = "loading" class = "flex h-full w-full text-center align-center items-center justify-center">Coming soon! Please stay tuned.</div> */}
            </div>
        </div>
    )
}