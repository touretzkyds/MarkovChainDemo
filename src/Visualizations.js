import React, {useState, useEffect} from "react";
import CytoscapeComponent from "react-cytoscapejs";
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import { useDictContext } from "./Context";

cytoscape.use(dagre);

export default function Visualizations() {

    //Get variables needed from the shared context
    const {nGramDict, modelType, textGenMode, generatedText, 
           reFormatText, setCurrentWord, setKey, setKeysAdded,
           wordOptions, clearButtonClicked, setClearButtonClicked} = useDictContext();

    //State variable to check whether the current display has successfully been reset
    const [isReset, setIsReset] = useState(false);

    //Variables to store the layout, layout type, and a flag to signal whether the layout has been built
    const [layout, setLayout] = useState();
    const layoutName = "preset";
    const [layoutBuilt, setLayoutBuilt] = useState(false);

    //Declare a state variable to house the graph and keep track of all added nodes
    const [graphData, setGraphData] = useState([]);

    //Flag to determine whether the manual graph has been rendered for each instance of words
    const [manualRendered, setManualRendered] = useState(false);

    //Set current reference of graph div to null
    let graphRef = React.useRef(null);

    //CONSTANTS FOR PANE FOUR RENDERING (maximum x and y bounds)

    //Maximum height of graph away from central axis for both successor layers (vertically and horizontally)
    //For L2 successors, maximum y deviation is auto-calculated and thus does not need to be explicitly defined.
    const maxDeviationYL1 = -350;
    const maxDeviationXL1 = 120;
    let maxDeviationXL2 = maxDeviationXL1 + 40;
    
    //Node width and height
    const nodeWidth = 100;
    const nodeHeight = 50;

    //Jitter parameters
    const jitterX = 20;
    const jitterY = 9;

    //Bounding box width padding parameters (1 times the node width, 2 times the node width, 3 times, etc.)
    const boundingBoxPadding = 1;

    //Set graph style parameters
    const graphStyle = [
        {
            //Style parameters for nodes
            selector: "node",
            style : {
                'background-color': 'transparent', // Node background color
                "background-opacity" : 0,
                'label': 'data(label)', // Display the node's label
                'shape': 'ellipse', // Node shape
                'width': nodeWidth, // Node width
                'height': nodeHeight, // Node height
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
                'line-color': 'black', // Edge color
                "curve-style" : "bezier",
                'target-arrow-shape': 'triangle',
                'target-arrow-color' : 'black',
                'source-arrow-color' : 'black'
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

        //Empty current graph and list of graph data and added keys (the latter stored in context)
        setGraphData([]);
        setKeysAdded([]);
        //setWordOptions([]);
        setKey("");
        setCurrentWord("");

        //If we are in manual mode, set the manual text to be blank
        //if (textGenMode === "manual") {setManualText("")};
        
    }
    
    //The graph display should be updated when the dictionary and generated text changes
    //Note that the generated text is modified in both automatic and manual text generation modes
    //We only want to update the graph under automatic text generation mode.
    //So, when in automatic text generation mode, graph updates should be triggered by the generated text.
    //And, in manual mode, they should be triggered by the n-gram dictionary itself.

    useEffect(() => {
        if (textGenMode === "manual") {resetGraph();}

        //The following line suppresses warnings regarding not including some variables in the useEffect dependency array.
        //This is INTENTIONAL - said variables are NOT supposed to influence the given useEffect hook. 
        //eslint-disable-next-line react-hooks/exhaustive-deps
    }, [wordOptions])
    
    useEffect(() => {
        if (textGenMode === "automatic") {resetGraph();}

        //The following line suppresses warnings regarding not including some variables in the useEffect dependency array.
        //This is INTENTIONAL - said variables are NOT supposed to influence the given useEffect hook. 
        //eslint-disable-next-line react-hooks/exhaustive-deps
    }, [generatedText])

    //Reset the graph additionally when the clear button in pane three has been clicked - this is only possible for manual text generation mode, but the execution is identical
    useEffect(() => {
        if (clearButtonClicked) {
            //resetGraph();
            setClearButtonClicked(false);
        }

        //The following line suppresses warnings regarding not including some variables in the useEffect dependency array.
        //This is INTENTIONAL - said variables are NOT supposed to influence the given useEffect hook. 
        //eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clearButtonClicked])


    //If the layout has not been yet defined or built, and the graph is currently empty, set the reset flag to true - all variables are now at their default position
    useEffect(() => {
        //Verify that the aforementioned is the case
        if (layout === undefined && layoutBuilt === false && graphData.length === 0) {
            setIsReset(true);
        }
    }, [layout, layoutBuilt, graphData])

    //Function to render a given layer of successors, called upon each iteration at a time


    //Function to build graph based on dictionary
    const buildGraph = () => {

        //Set keys array
        let dictArr = Array.from(nGramDict);
        const dictKeys = dictArr.map(function (pair) {return pair[0];});

        //Set an array to track all added nodes
        let allAddedNodes = [];

        //If the text generation mode is manual, pick the start key based on the final keys of the generated text if they exist
        let startKey = "";

        if (textGenMode === "manual") {
            
            //Based on the model type, decide the final n words to check
            let n = 1;
            if (modelType === "Tri-gram") {n = 2;}
            else if (modelType === "Tetra-gram") {n = 3;}
            
            //Check to see if the generated text is long enough, if not, then use as start key without additional concerns
            if (true || generatedText.trim(" ").split(" ").length <= n) {
                startKey = generatedText.trim(" ").split(" ").slice(-n).join(" ");
            }
            //If the generated text is longer, however, the start key will be two n behind
            else {
                let endBound = -n;
                if (n >= 2) {endBound = -n + 1}
                startKey = generatedText.trim(" ").split(" ").slice(-2 * n, endBound).join(" ");
            }
            
            startKey = startKey.trim(" ");

            if (n === 1 && startKey.trim(" ").split(" ").length >= 2) {
                startKey = startKey.trim(" ").split(" ")[0]
            }
            //Set as current word
            //setCurrentWord(startKey);

            //Set the manual rendered flag as true
            setManualRendered(true);

        } else {
            //Otherwise, pick a word from the dictionary at random, add to graph (if not already present) and added node list
            startKey = dictKeys[Math.floor(Math.random() * dictKeys.length)];
        }

        if (startKey === undefined || startKey === null || startKey === "") {return}

        if (!startKey.split(" ").includes("undefined")) {

            //Place point at (0, 0)
            let newGraphPoint = {data : {id : reFormatText(startKey), label : reFormatText(startKey)}, position : {x:Math.random()}};
            setGraphData(existingGraph => [...existingGraph, newGraphPoint]);
            allAddedNodes.push(startKey);
        }

        //Iterate through each successor word
        let successorsL1 = Array.from(nGramDict.get(startKey));
        successorsL1 = successorsL1.map(function (pair) {return pair[0];})

        //Array of all L1 successor IDs (needed for the branches)
        let successorIDsL1 = []

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

        // //If we are in manual text generation mode and the length of the text is the length of one key (we are on the first word), only display first order successors
        // if (textGenMode === "manual") {
        //     let genTextLen = generatedText.trim(" ").split(" ").length;
        //     if ((modelType === "Bi-gram" && genTextLen === 1) || (modelType === "Tri-gram" && genTextLen === 2) || (modelType === "Tetra-gram" && genTextLen === 3)) {
        //         renderSecondOrderSuccessors = false;
        //     }
        // }

        //Log the positions of all of the first order successors (to aid in generating the second-order bounding box heights)
        let allFirstOrderPositions = [];

        //Array to keep track of maximum widths of each row for second-order successors (needed for bounding box generation)
        let maxWidths = [];

        //Array to keep track of the number of second-order columns for each row, if any
        let L2ColumnsPerRow = [];

        //Array to keep track of column size for each set of L2 successors
        let columnSizes = [];

        //Array to track length of each second order successor tree - needed for determining if a box must be drawn
        let successorL2Lengths = [];

        for (let i = 0; i < maxFirstOrderSuccessors; i++) {

            //Get value
            let unformattedSuccessor = successorsL1[i];
            let successor = reFormatText(unformattedSuccessor);
            
            //Set to starting node position + 50 and subtract by i * (50/2) until four nodes have been added; then, shift x by another 50 and repeat the process
            //Do the same for the nested loop

            //Node
            if (counterL1 % 5 === 0) {
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
            else if (maxFirstOrderSuccessors % 5 === 0) {maxColumnNodes = 5;}
            else {maxColumnNodes = maxFirstOrderSuccessors % 5;}

            yCoordinateL1 += (Math.abs(maxDeviationYL1) * 2 / (maxColumnNodes + 1));

            //Check how many times the sucessor as already been added
            let successorCount = allAddedNodes.filter(node => node === successor).length.toString();

            //Generate a node label depending on the model type
            let nodeLabel = successor;
            if (modelType === "Tri-gram") {nodeLabel = reFormatText(startKey.split(" ")[startKey.split(" ").length - 1] + " " + successor);}
            else if (modelType === "Tetra-gram") {nodeLabel = reFormatText(startKey.split(" ")[startKey.split(" ").length - 2] + " " + startKey.split(" ")[startKey.split(" ").length - 1] + " " + successor);}

            //Add jitter if second-order sucessors are not being rendered
            if (!renderSecondOrderSuccessors) { //&& maxFirstOrderSuccessors > 1
                let newGraphPoint = {data : {id : successor + successorCount, label : nodeLabel}, position : {x: xCoordinateL1 + Math.floor(Math.random() * (jitterX * 2 + 1) - jitterX), y : yCoordinateL1 + Math.floor(Math.random() * (jitterY * 2 + 1) - jitterY)}};
                setGraphData(existingGraph => [...existingGraph, newGraphPoint]);
            } else {
                let newGraphPoint = {data : {id : successor + successorCount, label : nodeLabel}, position : {x : xCoordinateL1, y: yCoordinateL1}};
                setGraphData(existingGraph => [...existingGraph, newGraphPoint]);
            }
            
            //Increment L1 node counter
            counterL1++;

            //Add to successor L1 IDs
            successorIDsL1.push(successor + successorCount);
            
            allAddedNodes.push(successor);

            //Now, generate the successors of each subtree (if required)
            if (!renderSecondOrderSuccessors) {continue;}

            //Store the y-coordinate position
            allFirstOrderPositions.push(yCoordinateL1);

            //If dealing with a tri-or-tetra-gram model, leverage the startKey to generate the appropriate L1 key to access the L2 successors
            let secondOrderKey = unformattedSuccessor;
            //Tri-gram key: last word + current word
            if (modelType === "Tri-gram") {secondOrderKey = startKey.split(" ")[startKey.split(" ").length - 1] + " " + unformattedSuccessor}
            //Tetra-gram key: last two words + current word
            else if (modelType === "Tetra-gram") {secondOrderKey = startKey.split(" ")[startKey.split(" ").length - 2] + " " + startKey.split(" ")[startKey.split(" ").length - 1] + " " + unformattedSuccessor}

            //Second order successors
            let successorsL2 = Array.from(nGramDict.get(secondOrderKey));

            //Get second successor group
            successorsL2 = successorsL2.map(function (pair) {return pair[0];});

            //For handling auto-sizing of columns
            let columnSize;

            if (maxFirstOrderSuccessors === 5) {columnSize = 2;}
            else if (maxFirstOrderSuccessors === 4) {columnSize = 2;}
            else if (maxFirstOrderSuccessors === 3) {columnSize = 3;}
            else if (maxFirstOrderSuccessors === 2) {columnSize = 4;}
            else {columnSize = 5;}

            //Append column size
            columnSizes.push(columnSize);

            //Row and column counters
            let counterL2 = 0;
            let columnCounterL2 = 0;

            //L2 Successor Length (store in array as well)
            let l2SuccessorLength = successorsL2.length;
            successorL2Lengths.push(l2SuccessorLength);

            //Coordinates
            let xCoordinateL2 = maxDeviationXL2 * 3;
            let yCoordinateL2; //= yCoordinateL1 - (50 * (columnSize - 1));

            if (l2SuccessorLength < columnSize) {yCoordinateL2 = yCoordinateL1 - (25 * (l2SuccessorLength + 1));} 
            else {yCoordinateL2 = yCoordinateL1 - (25 * (columnSize + 1));}


            //If this is a tri-or-tetra-gram model, add the last one and two words respectively of the previous successor
            //The idea is that when the user reads the L2 section, they'll see a sequence of words and then some indivdual words inside a box
            //By combining the given sequence and whatever word they pick from inside the box, they'll have generated a new key

            //The following flag will be turned to true if, for all non-bi-gram models, a single key-L2 successor pair has already been added to a single node (i.e. there is only one L2 successor)
            let nonBiGramL2PairAdded = false;

            if (modelType !== "Bi-gram") {

                //Create initial word sequence; add a plus sign at the end to indicate that it will be joined by a word from the box of provided selections
                let initWordSequence;
                if (modelType === "Tri-gram") {
                    initWordSequence = reFormatText(secondOrderKey.split(" ")[secondOrderKey.split(" ").length - 1]);
                } else if (modelType === "Tetra-gram") {
                    initWordSequence = reFormatText(secondOrderKey.split(" ")[secondOrderKey.split(" ").length - 2] + " " + secondOrderKey.split(" ")[secondOrderKey.split(" ").length - 1]);
                }

                //Check to see if one or multiple L2 successors are present. If just one, lump together with the initWordSequence. Otherwise, draw a box and join
                let sequenceNodeBeforeBox;

                //Create new node with the given sequence and add to the graph
                //Y-position should be identical to that of the first-order successor

                if (l2SuccessorLength < 2) {
                    sequenceNodeBeforeBox = {data : {id : initWordSequence + " " + reFormatText(successorsL2[0]), label : initWordSequence + " " + reFormatText(successorsL2[0])}, position : {x: xCoordinateL2, y : yCoordinateL1}};
                    //Set flag
                    nonBiGramL2PairAdded = true;
                } else {
                    sequenceNodeBeforeBox = {data : {id : initWordSequence, label : initWordSequence}, position : {x: xCoordinateL2, y : yCoordinateL1}};
                }

                //Increment the x-coordinate positioning as well; this is leveraged by both the successor positioning logic and the box drawing mechanism
                xCoordinateL2 += maxDeviationXL2;

                //Add to graph data
                setGraphData(existingGraph => [...existingGraph, sequenceNodeBeforeBox]);

            }

            //Iterate through all L2 successors
            for (let j = 0; j < successorsL2.length; j++) {

                //Get successor word
                let successorL2 = reFormatText(successorsL2[j]);

                if (counterL2 % columnSize === 0 && counterL2 !== 0) {
                    xCoordinateL2 += maxDeviationXL2;
                    yCoordinateL2 = yCoordinateL1 - ((columnSize + 1) * (50 / 2));
                    counterL2 = 0;

                    //Increment second order column counter
                    columnCounterL2++;
                }

                //If this is the final column, add the maximum width to the array
                //Also push the number of columns
                if (j === successorsL2.length - 1) {
                    maxWidths.push(xCoordinateL2)
                    L2ColumnsPerRow.push(columnCounterL2);
                }

                yCoordinateL2 += 50;

                //Add to graph (whether the successor has already been included or not is of no consequence)
                //Use previous successor count simply to generate a new ID that is unique
                //Check how many times the successor as already been added
                let successorCountL2 = allAddedNodes.filter(node => node === successorL2).length;
                
                //If only one successor is present, do not jitter (box rendering will also be disabled for these cases).
                //If only one successor is present while the model is NOT a bi-gram, the aforementioned nonBiGramL2PairAdded flag will be true - do NOT render any nodes if that is the case
                //Continue if all the necessary successors have already been rendered
                
                if (nonBiGramL2PairAdded) {continue;}

                let newGraphPointL2;   
                if (successorsL2.length > 1) {newGraphPointL2 = {data : {id : successorL2 + successorCountL2, label : successorL2}, position : {x : xCoordinateL2 + Math.floor(Math.random() * (jitterX * 2 + 1) - jitterX), y : yCoordinateL2 + Math.floor(Math.random() * (jitterY * 2 + 1) - jitterY)}};} 
                else {newGraphPointL2 = {data : {id : successorL2 + successorCountL2, label : successorL2}, position : {x: xCoordinateL2, y : yCoordinateL2}};}
                
                setGraphData(existingGraph => [...existingGraph, newGraphPointL2]);
                allAddedNodes.push(successorL2);
                counterL2++;

            }

        }

        //If not rendering second order successors, generate a box around the existing graph elements, not including the start word
        if (!renderSecondOrderSuccessors) {

            //Establish right and left bounds, including "padding" that is boundingBoxPadding * the width of the node
            const rightPos = xCoordinateL1 + (boundingBoxPadding * nodeWidth);
            const leftPos = 2 * maxDeviationXL1 - (boundingBoxPadding * nodeWidth);

            //Find width and midpoint
            const width = rightPos - leftPos
            const midpoint = (rightPos + leftPos) / 2;

            //Define bounding box
            const boundingBox = {
                "group" : "nodes",
                data : {id : "BOX_L1", label : ""},
                position : {
                    x : midpoint,
                    y: 0,
                },
                style : {
                    width : width,
                    height : Math.abs(maxDeviationYL1 * 1.7),
                    shape : "roundrectangle",
                    'background-color' : "F5F5F5",
                    "background-opacity" : 100,
                    "border-width" : 3,
                    "border-color" : "black",
                }
            }

            //Add box to graph
            setGraphData(existingGraph => [...existingGraph, boundingBox])

            //Add branches
            let newBranchL1 = {data : {source : reFormatText(startKey), target : "BOX_L1", label : reFormatText(startKey) + "BOX_L1"}};
            setGraphData(existingGraph => [...existingGraph, newBranchL1]);
        
        //If rendering second-order successors, generate an individual box around each level of second-order successors
        } else {

            //The left position must be shifted to 4 * maxDeviationXL2 if the model is a tri-or-tetra-gram.
            //This is as a previous chain of words has now been added before the box begins for these model types.
            let deviationFactor = 3;
            if (modelType !== "Bi-gram") {deviationFactor = 4;}

            //Iterate through each L1 successor
            for (let i = 0; i < maxFirstOrderSuccessors; i++) {

                //Verify that the length of the second order successors is greater than one; if not, make the box invisible
                let box_color = "black"
                if (successorL2Lengths[i] < 2) {box_color = "white";}

                //Define positions of left and right boxes
                //Add boundingBoxPadding * the node width to ensure the box goes around the words
                //The XL2 deviation will be multiplied by the aforementioned deviation factor
                //This should be done for the inner box
                const rightPos = maxWidths[i] + (boundingBoxPadding * nodeWidth);
                const leftPos = deviationFactor * maxDeviationXL2 - (boundingBoxPadding * nodeWidth);

                //Two boxes will be created in the instance that the model is not a Bi-gram - one outer, one inner.
                //The outer box will be invisible and include the key fragment prior to the intended successor chain
                //The inner box will simply be the successor candidates.

                //Create an outerLeftPos variable
                let outerLeftPos = 3 * maxDeviationXL2 - (boundingBoxPadding * nodeWidth);

                //Box colour is set to white if not 
                
                if (modelType !== "Bi-gram") {

                    //Calculate outer left bound for the outer box
                    outerLeftPos = 3 * maxDeviationXL2 - (boundingBoxPadding * nodeWidth);

                    const innerBoxDist = Math.abs(rightPos - leftPos);
                    const innerMidpoint = (rightPos + leftPos) / 2;

                    //Create the inner box
                    //Set the actual L2 bounding box
                    const innerBoundingBox = {
                        "group" : "nodes",
                        data : {id : "BOX_L2_INNER_" + i, label : ""},
                        position : {
                            x : innerMidpoint,//(maxWidths[i] - (3 * maxDeviationXL2))/2 + (3 * maxDeviationXL2),//(((100 + maxWidths[i]) - (3 * maxDeviationXL2)) / 2) + 3 * maxDeviationXL1,
                            y: allFirstOrderPositions[i],
                        },
                        style : {
                            width : innerBoxDist - 50 + "px",//(maxWidths[i] - (3 * maxDeviationXL2)) + ((maxWidths[i] - (3 * maxDeviationXL2)) / 2),//(maxWidths[i] + 50) - ((3 * maxDeviationXL2) - 50),//(100 * (L2ColumnsPerRow[i] + 1)) + (maxDeviationXL2 * (L2ColumnsPerRow[i])),
                            height : (columnSizes[i] + 1) * 40,//(columnSizes + 1) * 25 + 20,
                            shape : "roundrectangle",
                            'background-color' : "white",
                            "background-opacity" : 0,
                            "border-width" : 3,
                            "border-color" : box_color,
                            "z-index" : 9999
                        }
                    }

                    //Add box to graph
                    setGraphData(existingGraph => [...existingGraph, innerBoundingBox])

                    //Set box colour to white if the model is not a bi-gram one
                    box_color = "white";

                }

                //Find distance between left and right bounding boxes
                const boxDist = Math.abs(rightPos - outerLeftPos);
                //Find the midpoint
                const midpoint = (rightPos + outerLeftPos) / 2;

                //If this box is a single successor (i.e. a single word), shrink the height dramatically to prevent any overlap between the white and black borders
                let height;
                if (box_color === "white" && modelType === "Bi-gram") {height = 77;}
                else {height = (columnSizes[i] + 1) * 40};

                //Set the actual L2 bounding box
                const boundingBox = {
                    "group" : "nodes",
                    data : {id : "BOX_L2_" + i, label : ""},
                    position : {
                        x : midpoint,//(maxWidths[i] - (3 * maxDeviationXL2))/2 + (3 * maxDeviationXL2),//(((100 + maxWidths[i]) - (3 * maxDeviationXL2)) / 2) + 3 * maxDeviationXL1,
                        y: allFirstOrderPositions[i],
                    },
                    style : {
                        width : boxDist + "px",//(maxWidths[i] - (3 * maxDeviationXL2)) + ((maxWidths[i] - (3 * maxDeviationXL2)) / 2),//(maxWidths[i] + 50) - ((3 * maxDeviationXL2) - 50),//(100 * (L2ColumnsPerRow[i] + 1)) + (maxDeviationXL2 * (L2ColumnsPerRow[i])),
                        height : height,
                        shape : "roundrectangle",
                        'background-color' : "white",
                        "background-opacity" : 0,
                        "border-width" : 3,
                        "border-color" : box_color,
                    }
                }

                //Add box to graph
                setGraphData(existingGraph => [...existingGraph, boundingBox])

                //Create branches
                let newBranchL2 = {data : {source : successorIDsL1[i], target : "BOX_L2_" + i, label : successorIDsL1[i] + "BOX_L2_" + i}};
                setGraphData(existingGraph => [...existingGraph, newBranchL2]);

                let newBranchStartL2 = {data : {source : reFormatText(startKey), target : successorIDsL1[i], label : reFormatText(startKey) + successorIDsL1[i]}};
                setGraphData(existingGraph => [...existingGraph, newBranchStartL2]);

            }
        }
    }

    //Create a function to render a graph. As mentioned above, it should be triggered by changing generatedText in automatic mode and nGramDict in manual mode.
    const renderGraph = () => {

        //Check continuously for whether the graph has been reset, the key has changed, or potential word choices have been updated
        //If any of the above are true, the key is NOT blank (i.e. it has been chosen), and the graph has successfully been reset, re-render the graph
        //Simultaneously, re-define the layout.

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
                circle: false,
                // grid: false,
                avoidOverlap: true,
                //spacingFactor: 1.5 + Math.random() * (1.8 - 1.5),
                nodeDimensionsIncludeLabels: false,
                //boundingBox: {x1 : 0, y1 : 0, x2 : 500, y2: 500},
                animate: true,
                gravity : 1,
                randomize: false,
                ready: false,
                stop: false,
            });
        }
    }

    //Render graph for various text generation modes

    useEffect(() => {
        if (textGenMode === "manual" && isReset && !manualRendered && generatedText !== "") {renderGraph();}

        //The following line suppresses warnings regarding not including some variables in the useEffect dependency array.
        //This is INTENTIONAL - said variables are NOT supposed to influence the given useEffect hook. 
        //eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isReset, generatedText, textGenMode])

    //Each time wordOptions changes, enable the rendering of the manual graph
    useEffect(() => {
        if (textGenMode === "manual") {setManualRendered(false);}

        //The following line suppresses warnings regarding not including some variables in the useEffect dependency array.
        //This is INTENTIONAL - said variables are NOT supposed to influence the given useEffect hook. 
        //eslint-disable-next-line react-hooks/exhaustive-deps
    }, [generatedText])

    useEffect(() => {
        if (textGenMode === "manual") {setManualRendered(false);}
    }, [textGenMode])

    useEffect(() => {
        if (textGenMode === "automatic") {renderGraph();}

        //The following line suppresses warnings regarding not including some variables in the useEffect dependency array.
        //This is INTENTIONAL - said variables are NOT supposed to influence the given useEffect hook. 
        //eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isReset, generatedText])


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