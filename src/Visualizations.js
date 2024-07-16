import React, {useState, useEffect, useRef} from "react";
import CytoscapeComponent from "react-cytoscapejs";
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import { useDictContext } from "./Context";
import { render } from "@testing-library/react";

cytoscape.use(dagre);

export default function Visualizations() {


    /*

    Some ideas for the multi-pane visualizations that are needed for the re-sizing algorithm.

    Rather than re-placing and re-moving all of the words, we should place them in the right spot the first time.

    We should write a separate function that deals with taking all of the current positions for all of the different words, and then rendering them.

    //Or actually - it hasn't been rendered yet.

    Add stuff to the graph data portion first.

    Then, here's what we're going to do. We're going to set a function that takes in the maximum number of columns - perhaps 11.
    The goal is for the function to optimize this function by maximizing the amount of rows filled, with the counter goal of
    minimizing the total length for any given set of L2 successors.
    How do we actually do this?
    Well, we have to check the input variables. There are two - the number of rows, and the successor chosen to make this happen.
    What's the mathematical relationship between the two?

    1-to-1 -> increasing the number of rows will just add 1 to the column size


---

Alright, let's clean things up. Every single thing should be its own function.

We have a function for building the graph. Let's make a general outline and figure out what goes where.

1. Figure out what the start word is, based on the value of n. Create the vertically stacked node.
2. Find L1 successors, create brackets, and set up variables. Determine the length of second-order successors, and whether or not they should be rendered
3. Iterate through all first-order successors. Change columns when appropriate, and align based on the max number of words allowed per column. For each iteration, change the y-coordinate.
4a. Generate, iteratively, the first-order successors. For bi-gram models, simply place the node. For tri-and-tetra-gram models, iteratively generate the L1 successors in a vertical stack.
4b. If generating second-order successors, also add bracket nodes to the right (and append to the respective array).
 --> This could most likely be simplified further. 
5. If a bi-gram model, add the successor directly to the array,
6. Now, if generating second-order successors, create the second order keys, generate the successors, and figure out the maximum allowable size for each column (max columnSize)
7. For tri-and-tetra-gram models, add the previous hanging key before adding the remainder of the successors
8. Set x-and-y coordinates. Use the columnSize if more than one column, or simply the length of the successors if this is not the case.
9. Iterate through each one of the second-order successors, accounting for the final column, and generate the respective elements.
10. Generate boxes around the respective elements, based on the stored starting positions.

Where should the iterative "longest guy" algorithm take place?
Well, what does it entail?
a) Basically, the goal is to reduce the width of the ENTIRE graph - the longest guy. 
b) This doesn't necessarily mean squeeze everything all into one column. Instead, it means that the longest row should be as short as possible
c) Where there's room, we want to split an existing set of words across both columns -> creating an even distribution.

So, how do we do this? 

Well, we could just place everything on the graph and then slowly find the longest guy and keep reducing it's length until it's no longer the longest guy
This would require a lot of rearrangements...ideally, we want to start off with the correct positions and only render the graph once.
Create an array with the maximum length sizes of L2 successor set. [5, 3, 10, 2] Also keep track of the total number of rows used (with a maximum upper bound set)
Find the longest one. Reduce as much as possible -> either until it's less than the next largest successor, or until the total number of columns have been exceeded.
The intuition makes sense. The question is - how do we implement this, while managing all of the different IDs that have been created? 
Well, the rendering logic is the same - the same method for calculating x-and-y coordinates. The only thing that's changing is the actual column size.
We don't even have to render this iteratively. n_columns = total/column_size. We keep doing total/column_size until one of the two exit conditions mentioned above are met, and then we draw the graph.
And, we can gene3rate the initial array of longest guys from this logic as well. We don't need to generate the L2 successors based on each L1 successor; we can do them separately as long as the flag is true.

*/


    //Get variables needed from the shared context
    const {nGramDict, modelType, textGenMode, generatedText, 
           reFormatText, unFormatText, pane2KeyClicked, setPane2KeyClicked, globalStartKey, setGlobalStartKey, manualStartKey, setManualStartKey,
           setCurrentWord, setKey, graphData, setGraphData, setKeysAdded, wordOptions, clearButtonClicked, setClearButtonClicked} = useDictContext();

    //Store a reference to the cytoscape component so that we can directly refer to and alter it
    let graphRef = useRef(null);

    //State variable to check whether the current display has successfully been reset
    const [isReset, setIsReset] = useState(false);

    //Variables to store the layout, layout type, and a flag to signal whether the layout has been built
    const [layout, setLayout] = useState();
    const layoutName = "preset";
    const [layoutBuilt, setLayoutBuilt] = useState(false);

    //Set a non-state version of the same thing - this allows us to directly manipulate the array without worrying about state updates
    let graphArr = [];

    //Flag to determine whether the manual graph has been rendered for each instance of words
    const [manualRendered, setManualRendered] = useState(false);

    //CONSTANTS FOR PANE FOUR RENDERING (maximum x and y bounds)

    //Maximum height of graph away from central axis for both successor layers (vertically and horizontally)
    //For L2 successors, maximum y deviation is auto-calculated and thus does not need to be explicitly defined.
    let maxDeviationYL1 = -500; //340
    //Max Deviation YL1 for first-generation boxes (spacing is not necessary)
    let maxDeviationYL1BoxL1 = -200;
    let maxDeviationXL1 = 170;
    let maxDeviationYL2 = 25;
    //Control the spread of L2 nodes
    let maxDeviationSplitL2 = 200;
    let maxDeviationXL2 = 220;
    
    //Node width and height
    const nodeWidth = 150;
    const nodeHeight = 50;

    //Max length a word can be before text wrapping
    const maxWrap = nodeWidth + maxDeviationXL2/7

    //Jitter parameters
    const jitterX = 20;
    const jitterY = 9;
 
    //Bounding box width padding parameters (1 times the node width, 2 times the node width, 3 times, etc.)
    const boundingBoxPadding = 0.7;

    //Set graph style parameters
    const graphStyle = [
        {
            //Style parameters for nodes
            zoomingEnabled: false,
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
                'text-max-width' : maxWrap,
                "color" : "#14532D"
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
                'source-arrow-color' : 'black',
                "label" : "data(label)",
                "text-margin-y" : "-13"
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
        graphArr = [];
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
        if (textGenMode === "automatic" && !manualStartKey) {resetGraph();}

        //The following line suppresses warnings regarding not including some variables in the useEffect dependency array.
        //This is INTENTIONAL - said variables are NOT supposed to influence the given useEffect hook. 
        //eslint-disable-next-line react-hooks/exhaustive-deps
    }, [generatedText])

    useEffect(() => {
        if (textGenMode === "automatic" && pane2KeyClicked) {
            resetGraph();
        }

        //The following line suppresses warnings regarding not including some variables in the useEffect dependency array.
        //This is INTENTIONAL - said variables are NOT supposed to influence the given useEffect hook. 
        //eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pane2KeyClicked])

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

    //Function to generate factors given a number (incredibly useful when rendering column sizes)
    //Efficient solution - source https://stackoverflow.com/questions/22130043/trying-to-find-factors-of-a-number-in-js
    const findFactors = (number) => {
        
        //Check if the number is even
        const isEven = number % 2 === 0;
        const max = Math.sqrt(number);
        const inc = isEven ? 1 : 2;
        let factors = [1, number];

        for (let curFactor = isEven ? 2 : 3; curFactor <= max; curFactor += inc) {
            if (number % curFactor !== 0) {continue;}
            factors.push(curFactor);
            let complement = number / curFactor;
            if (complement !== curFactor) {factors.push(complement);}
        }
        
        return factors;
    }

    // //Function to format the nodes of the graph (for instance, making them ungrabbable)
    // const formatNodes = () => {
        
    //     //Access cytoscape reference if the graph has been rendered
    //     if (graphRef.current) {
            
    //         //Get cytoscape reference
    //         const cy = graphRef.current._cy;
    //         console.log("WORKING")
    //         //Make each node ungrabbable
    //         console.log("CY NODES:", cy.nodes())
    //         cy.nodes("").style("color", "black");
    //         cy.nodes().forEach(node => {
                
    //             console.log("MAKING UNGRABBBABLE")
    //             console.log("NODE GRABBABLE:", node[0]._private.grabbable);
    //             node.style("color", "orange")
    //             node[0]._private.grabbable = false;
    //             console.log("NODE GRABBABLE:", node[0]._private.grabbable);
    //         })

    //     }

    // }

    // //Each time the graph data changes, format the respective nodes
    // useEffect(() => {
    //     formatNodes();
    // }, [graphData, graphRef.current])

    //Function to build graph based on dictionary
    const buildGraph = () => {

        //Set keys array
        let dictArr = Array.from(nGramDict);
        const dictKeys = dictArr.map(function (pair) {return pair[0];});

        //Set an array to track all added nodes
        let allAddedNodes = [];

        //If the text generation mode is manual, pick the start key based on the final keys of the generated text if they exist
        let startKey = "";

        //However, if the dictionary key has been clicked by the user, leverage that as the starting point instead
        if (manualStartKey) {

            startKey = globalStartKey;
            setManualStartKey(false);
            setPane2KeyClicked(false);

        } else {
            
                //Based on the model type, decide the final n words to check
                let n = 1;
                if (modelType === "Tri-gram") {n = 2;}
                else if (modelType === "Tetra-gram") {n = 3;}
                
                startKey = generatedText.trim(" ").split(" ").slice(-n).join(" ").trim(" ");
    
                if (n === 1 && startKey.trim(" ").split(" ").length >= 2) {
                    startKey = startKey.trim(" ").split(" ")[0]
                }
    
                //Set the manual rendered flag as true
                setManualRendered(true);
        }

        if (startKey === undefined || startKey === null || startKey === "") {return;}

        if (!startKey.split(" ").includes("undefined")) {

            //For bi-gram models, simply place the word at 0,0
            //For non-bi-gram models, stack words vertically 
            let newGraphPoint;
            if (modelType === "Bi-gram") {

                //Create node and push
                newGraphPoint = {data : {id : reFormatText(startKey), label : reFormatText(startKey)}, position : { x : 0 }, grabbable : false};
                graphArr.push(newGraphPoint)
            
            } else {

                //Words array
                let words = reFormatText(startKey).split(" ");
                
                //Set maximum y coordinate tolerance
                let startYTolerance = 50;
                let startYCoord = -startYTolerance;

                //Determine required number of partitions
                let p = 0;
                if (modelType === "Tri-gram") {p = 2;}
                else {p = 3;}
                let style = ""
                //Iterate through each word and create a node
                for (let i = 0; i < words.length; i++){

                    //Update y-coordinate
                    startYCoord += (Math.abs(startYTolerance) * 2 / (p + 1));
                    
                    //Create new node - make the style bold if it is the last word on the list
                    
                    if (i === words.length - 1) {style = "bold"}
                    let newStartNode = {data : {id : words[i] + "_START_" + i, label : words[i]}, position : {x : 0, y : startYCoord}, style : {"font-weight" : style}, grabbable : false};
                    //Add to the graph
                    graphArr.push(newStartNode)

                }

                //Add a bracket node to the graph
                //Create bracket node
                let newBracketNode = {data : {id : reFormatText(startKey) + "_BRACKET", label : "]"}, position : {x: 0 + maxWrap/2, y : 0}, style : {height : 50, width : 25, "font-size" : 70}, grabbable : false};
                //Add to graph
                graphArr.push(newBracketNode)
                 
                //Iterate through each, display
                //newGraphPoint = {data : {id : reFormatText(startKey), label : reFormatText(startKey)}, position : {x:Math.random()}};
            }

            allAddedNodes.push(startKey);

        }

        //Iterate through each successor word
        //If the word has no further successors, create a second node titled "END OF CHAIN"
        if (nGramDict.get(startKey) === undefined) {
            setGraphData(graphArr);
            return;
        }

        let successorsL1 = Array.from(nGramDict.get(startKey));
        successorsL1 = successorsL1.map(function (pair) {return pair[0];})
        
        //2D array of all L1L2 successors
        let successorsL1L2 = [];

        //Array of all L0L1 successor IDs (needed for the branches going from the root word to the first level)
        let successorIDsL0L1 = [];
        //2D array of all L1L2 successor IDs (for the branches going from L1 to L2)
        let successorIDsL1L2 = [];

        //Bracket nodes
        let bracketNodesL0L1 = [];
        let bracketNodesL1L2 = [];

        //An array to store all of the "hanging" initial phrases above branches for L2 successors when successor count is greater than one
        let hangingInitPhrases = [];

        //Add existing start bracket node to bracketNodesLOL1 (if a tri-or-tetra-gram model)
        if (modelType !== "Bi-gram") {
            bracketNodesL0L1.push(reFormatText(startKey) + "_BRACKET");
        }

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

        //The following array of flags will be turned to true if, for all non-bi-gram models, a single key-L2 successor pair has already been added to a single node (i.e. there is only one L2 successor)
        let moreThanOneSuccessor = new Array(maxFirstOrderSuccessors).fill(false);

        //Log the positions of all of the first order successors (to aid in generating the second-order bounding box heights)
        let allFirstOrderPositions = [];

        //Array to keep track of maximum widths of each row for first-and-second-order successors (needed for bounding box generation)
        // let maxFirstOrderWidths = 0;
        let maxWidths = [];

        //Array to keep track of the number of second-order columns for each row, if any
        let L2ColumnsPerRow = [];

        //Array to keep track of column size for each set of L2 successors
        let columnSizes = [];

        //Array to track length of each second order successor tree - needed for determining if a box must be drawn
        let successorL2Lengths = [];

        //Max number of rows allowed
        let maxFirstOrderRows = 12;
        //Maximum allowed column size for separating a column into individual nodes
        let maxNodeSplitSize = 4;

        let limit = 0;

        if (renderSecondOrderSuccessors ||  modelType !== "Bi-gram") {
            limit = 5;
            maxFirstOrderRows = 5;
        }
        else {limit = maxFirstOrderRows;}

        //If not rendering second-order successors the model is a tri-or-tetra-gram, change the value of the max Y deviation.
        if (!renderSecondOrderSuccessors && modelType !== "Bi-gram") {
            maxDeviationYL1 = -100;
            yCoordinateL1 = maxDeviationYL1 - (Math.abs(maxDeviationYL1) * 2 / (maxFirstOrderRows - 1))
        }

        for (let i = 0; i < maxFirstOrderSuccessors; i++) {

            //Get value
            let unformattedSuccessor = successorsL1[i];
            let successor = reFormatText(unformattedSuccessor);
            
            //Set to starting node position + 50 and subtract by i * (50/2) until four nodes have been added; then, shift x by another 50 and repeat the process
            //Do the same for the nested loop

            //Node
            if (counterL1 % limit === 0) {
                if (renderSecondOrderSuccessors || modelType !== "Bi-gram") {
                    
                    xCoordinateL1 += maxDeviationXL1;
                    //If this is the last column, push the width to maxFirstOrder
                    //if (i === maxFirstOrderSuccessors - 1) {maxFirstOrderWidths = xCoordinateL1}
                    //If not rendering second order successors, start yCoordinateL1 one "level" higher
                    if (renderSecondOrderSuccessors) {
                        yCoordinateL1 = maxDeviationYL1;
                    } else {
                        let maxCols = 5;
                        if (successorsL1.length % 5 !== 0 && columnCounterL1 === Math.ceil(successorsL1.length/5)) {maxCols = successorsL1.length % 5}
                        //if (i === successorsL1.length - 1) {xCoordinateL1 -= maxDeviationXL1}
                        yCoordinateL1 = maxDeviationYL1 - (Math.abs(maxDeviationYL1) * 2 / (maxCols - 1));
                    }
                    
                } else {
                    xCoordinateL1 += maxDeviationXL1;
                    let rowsInColumn = maxFirstOrderRows;
                    
                    if (successorsL1.length < maxFirstOrderRows) {rowsInColumn = successorsL1.length};

                    // if (Math.floor(successorsL1.length / maxFirstOrderRows) === columnCounterL1 + 1) {
                    //     rowsInColumn = Math.floor(successorsL1.length % maxFirstOrderRows);
                    // }

                    //yCoordinateL1 = 0 - ((rowsInColumn + 1) * (maxDeviationYL2 / 2));
                    yCoordinateL1 = maxDeviationYL1BoxL1 - (Math.abs(maxDeviationYL1BoxL1) * 2 / (rowsInColumn - 1));
                }
                counterL1 = 0;

                //Increment the column counter
                columnCounterL1++;

            }

            //Determine the maximum number of nodes for this column
            //If in a column where filling all five nodes is possible, do so.
            //Otherwise, if we are on the final column, leverage the remainder
            let maxColumnNodes = 0;
            if (renderSecondOrderSuccessors || modelType !== "Bi-gram") {
                if (columnCounterL1 < (maxFirstOrderSuccessors / 5)) {maxColumnNodes = 5;}
                else if (maxFirstOrderSuccessors % 5 === 0) {maxColumnNodes = 5;}
                else {maxColumnNodes = maxFirstOrderSuccessors % 5;}
            } else {
                if (columnCounterL1 < (maxFirstOrderSuccessors / 5)) {maxColumnNodes = maxFirstOrderRows;}
                else if (maxFirstOrderSuccessors % 5 === 0) {maxColumnNodes = maxFirstOrderRows;}
                else {maxColumnNodes = maxFirstOrderSuccessors % maxFirstOrderRows;}
            }

            if (renderSecondOrderSuccessors || modelType !== "Bi-gram") {
                if (renderSecondOrderSuccessors) {
                    yCoordinateL1 += (Math.abs(maxDeviationYL1) * 2 / (maxColumnNodes + 1));
                } else {
                    if (successorsL1.length % 5 !== 0 && columnCounterL1 === Math.ceil(successorsL1.length/5)) {maxColumnNodes = successorsL1.length % 5}
                    yCoordinateL1 += (Math.abs(maxDeviationYL1) * 2 / (5 - 1))
                }
                
            } else {
                //Make sure that if the number of nodes we have is LESS than the maxColumnNodes, we space those evenly
                if (successorsL1.length < maxColumnNodes) {maxColumnNodes = successorsL1.length}
                yCoordinateL1 += (Math.abs(maxDeviationYL1BoxL1 * 2) / (maxColumnNodes - 1));
            }

            //Check how many times the successor as already been added
            let successorCount = allAddedNodes.filter(node => node === successor).length.toString();

            //Generate a node label depending on the model type
            let nodeLabel = successor;
            if (modelType === "Tri-gram") {nodeLabel = reFormatText(startKey.split(" ")[startKey.split(" ").length - 1] + " " + successor);}
            else if (modelType === "Tetra-gram") {nodeLabel = reFormatText(startKey.split(" ")[startKey.split(" ").length - 2] + " " + startKey.split(" ")[startKey.split(" ").length - 1] + " " + successor);}
            
            //Add jitter if second-order successors are not being rendered
            //If we are dealing with a bi-or-tri-gram model, arrange each word vertically and store.
            if (!renderSecondOrderSuccessors) { //&& maxFirstOrderSuccessors > 1

                if (modelType === "Bi-gram") {

                    //Jittered version is commented out; feel free to uncomment it if you'd like to add it back in (and comment the first line instead)
                    //Include probability of occurrence in the label
                    let prob = nGramDict.get(startKey).get(unformattedSuccessor).toFixed(2);
                    let newGraphPoint = {data : {id : successor + successorCount, label : nodeLabel + " (" + prob + ")"}, position : {x: xCoordinateL1, y : yCoordinateL1}, grabbable : false};

                    graphArr.push(newGraphPoint)

                } else {

                    //Get words
                    let words = nodeLabel.split(" ");

                    //Store currently available y-coordinate. For tri-gram models, evenly split the words around the central axis. For tetra-gram models, 
                    //split all three around the given axis.
                    //Assume a maximum sub-y deviation of 30 px
                    let maxTriTetraYDeviation = 0;
                    let triTetraYCoord = yCoordinateL1 - maxTriTetraYDeviation;

                    //Create a node from the last two words, immediately below the first
                    //For a tri-gram model, add the next word. For a tetra-gram model, add the next two words.
                    let newEndWordsPoint;
                    if (modelType === "Tri-gram") {
                        newEndWordsPoint = {data : {id : successor + successorCount + "_WORD_" + 1, label : words[1] + " (" + nGramDict.get(unFormatText(startKey)).get(unFormatText(words[1])).toFixed(2) + ")"}, position : {x: xCoordinateL1, y : triTetraYCoord}, style : {"font-weight" : "bold"}, grabbable : false};
                    } else {
                        newEndWordsPoint = {data : {id : successor + successorCount + "_WORD_" + 1, label : words[2] + " (" + nGramDict.get(unFormatText(startKey)).get(unFormatText(words[2])).toFixed(2) + ")"}, position : {x: xCoordinateL1, y : triTetraYCoord + 15}, style : {"font-weight" : "bold"}, grabbable : false};
                    }

                    graphArr.push(newEndWordsPoint)

                }

            } else {

                if (modelType === "Bi-gram") {

                    let newGraphPoint = {data : {id : successor + successorCount, label : nodeLabel}, position : {x : xCoordinateL1, y: yCoordinateL1}, grabbable : false};
                    graphArr.push(newGraphPoint)
                
                } else {
                    
                    //Get words
                    let words = nodeLabel.split(" ");

                    //Store currently available y-coordinate. For tri-gram models, evenly split the words around the central axis. For tetra-gram models, 
                    //split all three around the given axis.
                    //Assume a maximum sub-y deviation of 30 px
                    let maxTriTetraYDeviation = 45;
                    let triTetraYCoord = yCoordinateL1 - maxTriTetraYDeviation;
 
                    //Variable to determine number of required partitions
                    let n = 0;
                    if (modelType === "Tri-gram") {n = 2;}
                    else {n = 3;}

                    //Style variable - set the final word in the column to be bold
                    let style = ""

                    //Iterate through all words in the key
                    for (let i = 0; i < words.length; i++) {
                        
                        //Arrange y-coordinate accordingly
                        triTetraYCoord += (Math.abs(maxTriTetraYDeviation) * 2 / (n + 1));

                        //If last node in column, make bold
                        if (i === words.length - 1) {style = "bold";}

                        //Create node
                        let newTriTetraPoint = {data : {id : successor + successorCount + "_WORD_" + i, label : words[i]}, position : {x: xCoordinateL1, y : triTetraYCoord}, style : {"font-weight" : style}, grabbable : false};

                        //Add to the graph
                        graphArr.push(newTriTetraPoint)
                        
                        //If this is the final word, add to the successorIDsL0L1 list
                        if (i === words.length - 1) {
                            successorIDsL0L1.push(successor + successorCount + "_WORD_" + i);
                        }

                    }

                    //Create bracket node and add to graph
                    let newBracketNode = {data : {id : successor + successorCount + "_BRACKET", label : "]"}, position : {x: xCoordinateL1 + (maxWrap/2), y : yCoordinateL1}, style : {height : 50, width : 25, "font-size" : 70}, grabbable : false};
                    graphArr.push(newBracketNode)

                    //Add to array for branch creation
                    bracketNodesL1L2.push(successor + successorCount + "_BRACKET");

                }

            }
            
            //Increment L1 node counter
            counterL1++;

            //Add to successor L1 IDs
            //Don't do this for tri-and-tetra-gram models, as they have multiple nodes per level (logic for this has been handled above)
            if (modelType === "Bi-gram") {successorIDsL0L1.push(successor + successorCount);}
            
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
            //Again, if they don't exist, create an END OF CHAIN node, draw a branch, and return
            if (nGramDict.get(secondOrderKey) === undefined) {
                
                //For the bi-gram model, the source will be the start key. For tri-and-tetra-gram models, the source will be the bracket.
                let source;
                //The bi-gram target is the successor + 0, while the tri-and-tetra-gram targets are successor + 0 + _WORD_n (n = 1 for tri-grams and n = 2 for tetra-grams)
                let target;

                if (modelType === "Bi-gram") {
                    source = reFormatText(startKey);
                    target = successor + "0";
                }
                else {
                    source = reFormatText(startKey) + "_BRACKET";
                    if (modelType === "Tri-gram") {target = successor + "0" + "_WORD_1"}
                    else {target = successor + "0" + "_WORD_2";}
                }

                //Get probability
                let prob = nGramDict.get(unFormatText(startKey)).get(unFormatText(successor));
                if (prob !== undefined) {prob = prob.toFixed(2);}

                let newBranchL1 = {data : {source : source, target : target, label : prob}, grabbable : false};
                graphArr.push(newBranchL1);

                setGraphData(graphArr);

                //Return only if there is only ONE first-order successor - if not, continue
                if (maxFirstOrderSuccessors <= 1) {return;}
                else {continue;}
            }

            let successorsL2 = Array.from(nGramDict.get(secondOrderKey));

            //Get second successor group
            successorsL2 = successorsL2.map(function (pair) {return pair[0];});

            //For handling auto-sizing of columns
            let columnSize;

            if (maxFirstOrderSuccessors === 5) {columnSize = 4;}
            else if (maxFirstOrderSuccessors === 4) {columnSize = 6;}
            else if (maxFirstOrderSuccessors === 3) {columnSize = 7;}
            else if (maxFirstOrderSuccessors === 2) {columnSize = 9;}
            else {columnSize = 11;}

            //Append column size
            columnSizes.push(columnSize);

            //Get second successor group
            successorsL2 = successorsL2.map(function (pair) {return pair[0];});
            //Save

            //If this is a tri-or-tetra-gram model, add the last one and two words respectively of the previous successor
            //The idea is that when the user reads the L2 section, they'll see a sequence of words and then some individual words inside a box
            //By combining the given sequence and whatever word they pick from inside the box, they'll have generated a new key

            if (successorsL2.length <= 1 && modelType !== "Bi-gram") {

                //Add the final words (last word for tri-gram and last two words for tetra-gram) at the beginning of the successors list such that they will be rendered
                let n;
                if (modelType === "Tri-gram") {n = 1;}
                else {n = 2;}

                //Add words
                for (let i = 1; i <= n; i++) {successorsL2.unshift(reFormatText(secondOrderKey.split(" ")[secondOrderKey.split(" ").length - i]))}
                
                //Add false flag
                moreThanOneSuccessor[i] = false;

                //Add a blank string to the hangingInitPhrases array
                hangingInitPhrases.push("");
        
            //However, if there is more than one successor, create and store the initial "hanging" phrase that will go on the branch
            } else {
                if (modelType === "Tri-gram") {
                    //Add last word
                    hangingInitPhrases.push(reFormatText(secondOrderKey.split(" ")[secondOrderKey.split(" ").length - 1]));
                } else if (modelType === "Tetra-gram") {
                    //Add last two words
                    hangingInitPhrases.push(reFormatText(secondOrderKey.split(" ")[secondOrderKey.split(" ").length - 2] + " " + secondOrderKey.split(" ")[secondOrderKey.split(" ").length - 1]));
                }
                moreThanOneSuccessor[i] = true;
            }

            //L2 Successor Length (store in array as well)
            let l2SuccessorLength = successorsL2.length;
            successorL2Lengths.push(l2SuccessorLength);

        }

        if (renderSecondOrderSuccessors) {

            //Render optimal configuration of the graph - finding the ideal column size for each one.
            //First, set a maximum row size and an array to track how many columns are present per L2 successor set
            let maxRows = 18;

            //Alter the maximum number of rows based on the # of L1 successors
            //The deviation from 14 rows for a given number of L1 successors, x, is f(x) = -2(x-5)
            if (maxFirstOrderSuccessors !== 1) {maxRows = maxRows + (-2 * (maxFirstOrderSuccessors - 5));}
            
            //If dealing with a tri-or-tetra-gram model, subtract the number of rows by the number of L1 successors as they take up room as well.
            if (modelType === "Tri-gram") {maxRows -= maxFirstOrderSuccessors;}
            else if (modelType === "Tetra-gram") {maxRows  -= maxFirstOrderSuccessors - 2;}
            let totalL2Columns = {};
            //For keeping track of what the current number of rows are
            let currRows = 0;


            //Populate the array with the maximum lengths for each set
            let numL1Successors = columnSizes.length;
            for (let i = 0; i < numL1Successors; i++) {

                //Get the length

                totalL2Columns[i] = Math.floor(successorL2Lengths[i] / columnSizes[i]);
                //If a remainder is present, add one
                if (successorL2Lengths[i] % columnSizes[i] !== 0) {totalL2Columns[i]++;}
                //Add the column sizes (# of words per column) iteratively to see how many row slots have been occupied
                //If there's only one column, add the length of the successors
                if (successorL2Lengths[i] < columnSizes[i]) {currRows += successorL2Lengths[i];}
                else {currRows += columnSizes[i];}
                
            }

            //While the number of specified columns hasn't increased, pick the largest L2 successor chain and reduce accordingly
            
            let highestIdx = 0;
            let secondHighestIdx = 0;
            
            for (const [key, value] of Object.entries(columnSizes)) {
                columnSizes[key] = 1;
            }

            let successorLengthDict = {}
            //Dictionary of booleans with sorted status for each column
            let isColumnSorted = {}
            //Dictionary with an array of factors for each successorL2 length
            let factorArrays = {};

            //Update a dictionary to keep track of indexes, the total L2 Columns length array, a dictionary to keep track of each column's sorted status, and factors
            for (let i = 0; i < successorL2Lengths.length; i++) {
                successorLengthDict[i] = successorL2Lengths[i];
                totalL2Columns[i] = successorL2Lengths[i];
                isColumnSorted[i] = false;

                let factors = findFactors(successorL2Lengths[i]);
                factors.sort((a, b) => a - b);
                factorArrays[i] = factors;
                
            }

            currRows = successorL2Lengths.length;

            let breakLoop = false;
            while (!breakLoop && currRows <= maxRows && !Object.values(totalL2Columns).includes(0) && successorL2Lengths.some(value => value !== 1)) {

                //Sort dict (get items, sort them, and move to value)
                let dict_items = Object.keys(totalL2Columns).map((key) => {return [key, totalL2Columns[key]]});

                //Sort items
                dict_items.sort((first_val, second_val) => { return first_val[1] - second_val[1] })
                let sortedL2Columns = (dict_items.map((e) => {return e[0]})).reverse();
                
                //Store top two highest values
                highestIdx = Number(sortedL2Columns[0]);
                secondHighestIdx = Number(sortedL2Columns[1]);

                //If only one set of second-order successors is present, set the height to the maximum number of rows
                //But, if there is not more than one successor and the remainder is less than half of the given row size, increase the row size and repeat
                
                if (sortedL2Columns.length < 2) {

                    //Calculate column remainder
                    let remainder = 0;
                    
                    if (successorL2Lengths[highestIdx] > maxRows) {remainder = successorL2Lengths[highestIdx] % maxRows}
                    
                    if (columnSizes[0] < maxRows) {
                        columnSizes[0] = maxRows;

                        //If there is no remainder, simply break
                        if (remainder === 0) {break;}
                    
                    //We stop increasing the number of rows when the remainder grows sufficiently large or stops existing
                    } else if (remainder < (maxRows / 2)) {
                        maxRows++;
                        columnSizes[0] = maxRows;

                        if (remainder === 0) {break;}

                    } else {break;}

                }

                //Move on if the value at the highest idx has already been sorted and the values for both the highest and second highest are equal, break
                //if (isColumnSorted[highestIdx] && totalL2Columns[highestIdx] === totalL2Columns[secondHighestIdx]) {continue;}
                //if (isColumnSorted[highestIdx]) {break;}
                //Get all factors above the current columnSize value
                let factorsHighest = factorArrays[highestIdx].filter(factor => factor >= columnSizes[highestIdx])
                let factorsSecondHighest = factorArrays[highestIdx].filter(factor => factor >= columnSizes[secondHighestIdx])

                //let factorsSecondHighest = findFactors(totalL2Columns[secondHighestIdx]).sort();

                let factorIdx = 1; //We don't consider 1, so we start with the second index

                //Find factors of the highest value

                //Rearrange until we maximize the number of rows, without going over the limit set by currRows.
                while (currRows <= maxRows && (totalL2Columns[highestIdx] >= totalL2Columns[secondHighestIdx] )) {

                    //New candidate variables
                    let newColSize = columnSizes[highestIdx];
                    let newTotCol = totalL2Columns[highestIdx];

                    if (false && factorsHighest.length > 2) {

                        //Store previous column size for row calculations
                        let prevColSize = columnSizes[highestIdx];
                        //Set the column size to the next largest factor
                        newColSize = factorsHighest[factorIdx];
                        //Number of columns are now the complement of said factor
                        newTotCol = Math.floor(successorL2Lengths[highestIdx] / newColSize);
                        //Add the difference between the current and previous column sizes to the row counter
                        currRows += newColSize - prevColSize;

                        //Increment the factor idx
                        factorIdx++;
                    
                    //If the number is prime
                    } else {

                        //Store previous column size for row calculations
                        let prevColSize = columnSizes[highestIdx];

                        //Simply increase the column size rather than leveraging factors
                        newColSize++

                        //Number of columns are now the complement; use the ceiling (5 successors with a column size of two means three factors must be present.)
                        newTotCol = Math.ceil(successorL2Lengths[highestIdx] / newColSize);

                        //Add the difference between the current and previous column sizes to the row counter
                        currRows += newColSize - prevColSize;

                        //Check to see if, after the above changes, it is possible to further reduce the number of columns
                        //If the number of columns is still the same, get the remainder and check if it can be fit within the allotted number of rows
                        if (newTotCol >= totalL2Columns[highestIdx]) {
                            
                            //Get remainder
                            let remainder = 0;
                            if (successorL2Lengths[highestIdx] > (newColSize - 1)) {remainder = successorL2Lengths[highestIdx] % (newColSize - 1);}

                            //Get number of columns excluding the remainder
                            let columnsWithoutRemainder = newTotCol;
                            if (remainder > 0) {columnsWithoutRemainder--;}

                            //Calculate the number of extra rows required
                            let nExtraRows = Math.ceil(remainder/columnsWithoutRemainder);

                            //If the required number of extra rows goes over the amount of rows available, break
                            if (currRows + nExtraRows > maxRows) {
                                breakLoop = true;
                                break;}
                        }
                        
                    }

                    //Check to see if the row count has been exceeded. If not, assign. If so, stick to the older version and terminate the inner loop
                    if  (currRows >= maxRows) {
                        breakLoop = true;
                        break;
                    }
                    else {
                        columnSizes[highestIdx] = newColSize;
                        totalL2Columns[highestIdx] = newTotCol;
                    }

                }
                
                //The column at the highest index has now been sorted. Update its status.
                isColumnSorted[highestIdx] = true;

                if (currRows < maxRows && (factorsHighest.length > 2 || factorsSecondHighest.length > 2)) {

                }


            } 

            //Sort dict (get items, sort them, and move to value)
            let dict_items = Object.keys(totalL2Columns).map(
                (key) => {return [key, totalL2Columns[key]]}
            );

            //Sort items
            dict_items.sort(
                (first_val, second_val) => { return first_val[1] - second_val[1] }
            )

            let sortedL2Columns = (dict_items.map((e) => {return e[0]})).reverse();
    
            highestIdx = sortedL2Columns[0]
            secondHighestIdx = sortedL2Columns[1];
        
        }

        //Iterate over all column sizes - if we have a tri-or-tetra-gram model and the column size is less than one DESPITE there only being one successor, change this.
        if (modelType !== "Bi-gram") {
            for (let x  = 0; x < columnSizes.length; x++) {
            
                if (!moreThanOneSuccessor[x] && ((modelType === "Tri-gram" && columnSizes[x] === 1) || (modelType === "Tetra-gram" && columnSizes[x] === 2))) {

                    if (modelType === "Tri-gram") {columnSizes[x] = 2;}
                    else {columnSizes[x] = 3;}

                }
            }
        }

        //Now, that all of the positions have been determined render all second-order successors.
        for (let i = 0; i < maxFirstOrderSuccessors; i++) {

            let unformattedSuccessor = successorsL1[i];

            //Row and column counters
            let counterL2 = 0;
            let columnCounterL2 = 0;

            //Second order successors

            //Now, generate the successors of each subtree (if required)
            if (!renderSecondOrderSuccessors) {continue;}

            //If dealing with a tri-or-tetra-gram model, leverage the startKey to generate the appropriate L1 key to access the L2 successors
            let secondOrderKey = unformattedSuccessor;
            //Tri-gram key: last word + current word
            if (modelType === "Tri-gram") {secondOrderKey = startKey.split(" ")[startKey.split(" ").length - 1] + " " + unformattedSuccessor}
            //Tetra-gram key: last two words + current word
            else if (modelType === "Tetra-gram") {secondOrderKey = startKey.split(" ")[startKey.split(" ").length - 2] + " " + startKey.split(" ")[startKey.split(" ").length - 1] + " " + unformattedSuccessor}

            //Second order successors - exclude those that do not have second order successors
            if (nGramDict.get(secondOrderKey) === undefined) {continue;}
            let successorsL2 = Array.from(nGramDict.get(secondOrderKey));

            //Get second successor group
            successorsL2 = successorsL2.map(function (pair) {return pair[0];});
            let originalSuccessorL2length = successorsL2.length;
            //If this is a tri-or-tetra-gram model, add the last one and two words respectively of the previous successor
            //The idea is that when the user reads the L2 section, they'll see a sequence of words and then some individual words inside a box
            //By combining the given sequence and whatever word they pick from inside the box, they'll have generated a new key

            if (successorsL2.length <= 1 && modelType !== "Bi-gram") {

                //Add the final words (last word for tri-gram and last two words for tetra-gram) at the beginning of the successors list such that they will be rendered
                let n;
                if (modelType === "Tri-gram") {n = 1;}
                else {n = 2;}

                //Add words
                for (let i = 1; i <= n; i++) {successorsL2.unshift(reFormatText(secondOrderKey.split(" ")[secondOrderKey.split(" ").length - i]))}
                
                //Add false flag
                moreThanOneSuccessor[i] = false;
        
            //However, if there is more than one successor, create and store the initial "hanging" phrase that will go on the branch
            } else {
                if (modelType === "Tri-gram") {
                    //Add last word
                    hangingInitPhrases.push(reFormatText(secondOrderKey.split(" ")[secondOrderKey.split(" ").length - 1]));
                } else if (modelType === "Tetra-gram") {
                    //Add last two words
                    hangingInitPhrases.push(reFormatText(secondOrderKey.split(" ")[secondOrderKey.split(" ").length - 2] + " " + secondOrderKey.split(" ")[secondOrderKey.split(" ").length - 1]));
                }
                moreThanOneSuccessor[i] = true;
            }

            //L2 Successor Length (store in array as well)
            let l2SuccessorLength = successorsL2.length;
            successorL2Lengths.push(l2SuccessorLength);
        
            //Store successors in 2D array for box ID creation
            successorsL1L2.push([]);
            successorIDsL1L2.push([]);

            //Coordinates
            let xCoordinateL2 = maxDeviationXL2 * 3;
            let yCoordinateL2; //= yCoordinateL1 - (50 * (columnSize - 1));

            if (l2SuccessorLength < columnSizes[i]) {yCoordinateL2 = allFirstOrderPositions[i] - (maxDeviationYL2/2 * (l2SuccessorLength + 1));} 
            else {yCoordinateL2 = allFirstOrderPositions[i] - (maxDeviationYL2/2 * (columnSizes[i] + 1));}

            //Iterate through all L2 successors
            for (let j = 0; j < successorsL2.length; j++) {

                //Get successor word
                let successorL2 = reFormatText(successorsL2[j]);

                //Push to array
                successorsL1L2[i].push(successorL2);

                if (counterL2 % columnSizes[i] === 0 && counterL2 !== 0) {
                    xCoordinateL2 += maxDeviationXL2;

                    //Figure out how many rows are going to be in this column
                    let rowsInColumn = columnSizes[i];
                    //If this is the last column, then change column size to the number of remaining elements

                    if (Math.floor(successorsL2.length / columnSizes[i]) === columnCounterL2 + 1) {
                        rowsInColumn = Math.floor(successorsL2.length % columnSizes[i]);
                    }

                    yCoordinateL2 = allFirstOrderPositions[i] - ((rowsInColumn + 1) * (maxDeviationYL2 / 2));
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

                yCoordinateL2 += maxDeviationYL2//(Math.abs(maxDeviationYL2) * 2) / (counterL2 + 1);

                //Add to graph (whether the successor has already been included or not is of no consequence)
                //Use previous successor count simply to generate a new ID that is unique
                //Check how many times the successor as already been added
                let successorCountL2 = allAddedNodes.filter(node => node === successorL2).length;
                
                //If only one successor is present, do not jitter (box rendering will also be disabled for these cases).
                //If only one successor is present while the model is NOT a bi-gram, the aforementioned moreThanOneSuccessor flag will be true - do NOT render any nodes if that is the case
                //Continue if all the necessary successors have already been rendered
                
                //if (moreThanOneSuccessor) {continue;}

                let newGraphPointL2; 
                //Set style variable to bold if on last word
                let style;
                if (j === successorsL2.length - 1 || originalSuccessorL2length !== 1) {style = "bold"};

                //This line is commented out -> jitter has been temporarily disabled. If you would like to re-enable it, simply comment the third line and uncomment the next two.
                // if (successorsL2.length > 1) {newGraphPointL2 = {data : {id : successorL2 + successorCountL2, label : successorL2}, position : {x : xCoordinateL2 + Math.floor(Math.random() * (jitterX * 2 + 1) - jitterX), y : yCoordinateL2 + Math.floor(Math.random() * (jitterY * 2 + 1) - jitterY)}};} 
                // else {newGraphPointL2 = {data : {id : successorL2 + successorCountL2, label : successorL2}, position : {x: xCoordinateL2, y : yCoordinateL2}};}
                
                //Set the new node, including the probability of that node being selected as a successor to the previous layer parent.
                //First, remove all numbers from the right side of the string to extract the L01L1 word
                //Probability calculations will change based on the model
                let prob;
                
                if (modelType === "Bi-gram") {
                    prob = nGramDict.get(unformattedSuccessor).get(unFormatText(successorL2));
                } else if (modelType === "Tri-gram") {
                    let key = unFormatText(startKey.split(" ")[startKey.split(" ").length - 1] + " " + unformattedSuccessor)
                    prob = nGramDict.get(key).get(unFormatText(successorL2));
                } else {
                    prob = nGramDict.get(unFormatText(startKey.split(" ")[startKey.split(" ").length - 2] + " " + startKey.split(" ")[startKey.split(" ").length - 1] + " " + unformattedSuccessor)).get(unFormatText(successorL2));
                }

                if (prob !== undefined) {prob = prob.toFixed(2)}
                
                if (modelType === "Bi-gram") {
                    if (originalSuccessorL2length === 1) {
                        newGraphPointL2 = {data : {id : successorL2 + successorCountL2, label : successorL2}, position : {x: xCoordinateL2, y : yCoordinateL2}, grabbable : false};
                    } else {
                        newGraphPointL2 = {data : {id : successorL2 + successorCountL2, label : successorL2 + " (" + prob + ")"}, position : {x: xCoordinateL2, y : yCoordinateL2}, grabbable : false};
                    }
                } else {
                    //If the probability is undefined (meaning it is not the final word in the sequence; not a successor word), simply generate the node as is. Otherwise, display the probability
                    if (prob === undefined || (modelType === "Tri-gram" && originalSuccessorL2length === 1) || (modelType === "Tetra-gram" && originalSuccessorL2length === 1)) {
                        newGraphPointL2 = {data : {id : successorL2 + successorCountL2, label : successorL2}, position : {x: xCoordinateL2, y : yCoordinateL2}, style : {"font-weight" : style}, grabbable : false};
                    } else {
                        newGraphPointL2 = {data : {id : successorL2 + successorCountL2, label : successorL2 + " (" + prob + ")"}, position : {x: xCoordinateL2, y : yCoordinateL2}, style : {"font-weight" : style}, grabbable : false};
                    }
                }
                
                graphArr.push(newGraphPointL2)
                allAddedNodes.push(successorL2);
                counterL2++;

                //Push the ID of each L2 successor into the ID array
                successorIDsL1L2[i].push(successorL2 + successorCountL2);

                //If there is only one successor (keep in mind that the final words of the previous key have been added to successorsL2.length), add the final word to successorIDsL1L2 array
                // if (!moreThanOneSuccessor[i] && j === successorsL2.length - 1) {
                //     successorIDsL1L2.push(successorL2 + successorCountL2);
                // //Otherwise, push an empty string (blank)
                // } else if (moreThanOneSuccessor[i] && j === successorsL2.length - 1){successorIDsL1L2.push("");}
                

            }

        }
        
        //If not rendering second order successors, generate a box around the existing graph elements, not including the start word
        if (!renderSecondOrderSuccessors) {

            //Establish right and left bounds, including "padding" that is boundingBoxPadding * the width of the node
            let rightPos = xCoordinateL1 + (boundingBoxPadding * nodeWidth);
            let leftPos = 2 * maxDeviationXL1 - (boundingBoxPadding * nodeWidth);

            //Find width and midpoint
            let width = rightPos - leftPos
            let midpoint = (rightPos + leftPos) / 2;

            let boxBorderWidth = 3;
            if (modelType === "Bi-gram" && successorIDsL0L1.length <= Math.min(maxFirstOrderRows, maxNodeSplitSize)) {boxBorderWidth = 0;}

            let height = 0;
            if (!renderSecondOrderSuccessors && modelType !== "Bi-gram") {

                let columnCount = successorsL1.length / 5;
                if (successorsL1.length <= 5) {columnCount = 1;}

                height = Math.abs(maxDeviationYL1 * 2) * 1.2;
                //rightPos = maxDeviationXL1 + maxDeviationXL1 * columnCount;//+ (nodeWidth * columnCount) + boundingBoxPadding;
                leftPos =  maxDeviationXL1 * 2 - (boundingBoxPadding * nodeWidth);
                width = rightPos - leftPos
                midpoint = (rightPos + leftPos) / 2;
            
            } else {
                height = Math.abs(maxDeviationYL1) * 1.1;
            }

            //Define bounding box
            const boundingBox = {
                "group" : "nodes",
                data : {id : "BOX_L1", label : ""},
                grabbable : false,
                position : {
                    x : midpoint,
                    y: 0,
                },
                style : {
                    width : width,
                    height : height,
                    shape : "roundrectangle",
                    'background-color' : "F5F5F5",
                    "background-opacity" : 100,
                    "border-width" : boxBorderWidth,
                    "border-color" : "black",
                }
            }

            //Add box to graph
            graphArr.push(boundingBox);

            //Add branches - include "BRACKET" tag if a tri-or-tetra-gram model
            let newBranchL1;

            //If only one column is present, split into individual nodes (only for Bi-gram models)
            if (modelType === "Bi-gram") {
                if (successorIDsL0L1.length <= Math.min(maxFirstOrderRows, maxNodeSplitSize)) {
                    
                    //Iterate through each node and draw a branch
                    //Iterate over all L2 IDs
                    for (let x = 0; x < successorIDsL0L1.length; x++) {

                        //Create branch
                        let newDirectBranch = {data : {source : reFormatText(startKey), target : successorIDsL0L1[x], label : ""}, style : {"control-point-distance" : "-100px", "control-point-weight" : 0.25}, grabbable : false};

                        //Push to graph
                        graphArr.push(newDirectBranch)
                        
                    }

                } else {
                    newBranchL1 = {data : {source : reFormatText(startKey), target : "BOX_L1", label : ""}, grabbable : false};
                }
            } else {
                newBranchL1 = {data : {source : reFormatText(startKey) + "_BRACKET", target : "BOX_L1", label : ""}, grabbable : false};
            }
            
            if (newBranchL1 !== undefined) {graphArr.push(newBranchL1);}

            //If this is a tri-or-tetra gram model, add the last word of the start key to the top of the box along with a bracket
            if (modelType !== "Bi-gram") {

                //Get last word of the start key
                let topWord;
                if (modelType === "Tri-gram") {topWord = reFormatText(startKey.split(" ")[startKey.split(" ").length - 1]);}
                else {topWord = reFormatText(startKey.split(" ")[startKey.split(" ").length - 2] + " " + startKey.split(" ")[startKey.split(" ").length - 1]);}
                

                //Create top word node
                let newTopNode = {data : {id : topWord + "_TOP_PHRASE", label : topWord}, position : {x: midpoint, y : -height/2 - 25}, grabbable : false};
                //Create bracket node
                let newBracketNode = {data : {id : topWord + "_BRACKET", label : "]"}, position : {x: midpoint + ((rightPos - leftPos))/2 + 25 , y : - (height/2)}, style : {height : 50, width : 25, "font-size" : 70}, grabbable : false};

                //Add nodes to graph
                graphArr.push(newTopNode)
                graphArr.push(newBracketNode)
                
            }
        
        //If rendering second-order successors, generate an individual box around each level of second-order successors
        } else {

            //The left position must be shifted to 4 * maxDeviationXL2 if the model is a tri-or-tetra-gram.
            //This is as a previous chain of words has now been added before the box begins for these model types.
            let deviationFactor = 3;
            if (modelType !== "Bi-gram") {deviationFactor = 4;}

            //Iterate through each L1 successor
            for (let i = 0; i < maxFirstOrderSuccessors; i++) {

                //Skip if this is a dead-end successor
                if ((modelType === "Bi-gram" && nGramDict.get(unFormatText(successorsL1[i])) === undefined) ||
                    (modelType === "Tri-gram" && nGramDict.get(unFormatText(startKey.split(" ")[startKey.split(" ").length - 1] + " " + successorsL1[i])) === undefined) ||
                    (modelType === "Tetra-gram" && nGramDict.get(unFormatText(startKey.split(" ")[startKey.split(" ").length - 2] + " " + startKey.split(" ")[startKey.split(" ").length - 1] + " " + successorsL1[i])) === undefined)
                ) {continue;}

                //Verify that the length of the second order successors is greater than one; if not, make the box invisible
                let boxBorderWidth = 3;
                if (successorL2Lengths[i] < 2 || successorIDsL1L2[i].length <= Math.min(columnSizes[i], maxNodeSplitSize)) {boxBorderWidth = 0;}


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

                //Find distance between left and right bounding boxes
                const boxDist = Math.abs(rightPos - outerLeftPos);
                //Find the midpoint
                const midpoint = (rightPos + outerLeftPos) / 2;
                let height;
                
                //Don't create a box if only one L2 successor is present
                if (moreThanOneSuccessor[i]) {

                    //But, if multiple L2 successors are present, render boxes
                    //Later, we'll render the hanging initial phrases on top of the arrows (branches) themselves

                    //Figure out how many words are present in the highest column
                    let numWordsHighest;
                    if (successorL2Lengths[i] > columnSizes[i]) {numWordsHighest = columnSizes[i]}
                    else {numWordsHighest = successorL2Lengths[i]}

                    //If this box is a single successor (i.e. a single word), shrink the height dramatically to prevent any overlap between the white and black borders

                    if (boxBorderWidth === 0 && modelType === "Bi-gram") {height = 77;}
                    else {height = numWordsHighest * maxDeviationYL2};

                    //Set the actual L2 bounding box
                    const boundingBox = {
                        "group" : "nodes",
                        data : {id : "BOX_L2_" + i, label : ""},
                        grabbable : false,
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
                            "border-width" : boxBorderWidth,
                            "border-color" : "black",
                        }
                    }

                    //Add box to graph
                    graphArr.push(boundingBox)
            
                }

                //Create branches

                //From the source word to the first level
                //For tri-and-tetra-gram models, the target should be the successorIDsL1L2 array element for the given set
                let newBranchL0L1;

                //Get the associated probability between the start and L0L1 word

                if (modelType === "Bi-gram") {

                    //Get probability
                    let prob = nGramDict.get(startKey).get(successorsL1[i])
                    if (prob !== undefined) {prob = Number(prob).toFixed(2);}
                    newBranchL0L1 = {data : {source : reFormatText(startKey), target : successorIDsL0L1[i], label : prob}, grabbable : false};
                
                } else if (modelType === "Tri-gram") {

                    let prob = nGramDict.get(startKey).get(successorsL1[i]);
                    if (prob !== undefined) {prob = Number(prob).toFixed(2);}
                    newBranchL0L1 = {data : {source : reFormatText(startKey) + "_BRACKET", target : successorIDsL0L1[i], label : prob}, grabbable : false};
                
                } else {

                    let prob = nGramDict.get(startKey).get(successorsL1[i]);
                    if (prob !== undefined) {prob = Number(prob).toFixed(2);}
                    newBranchL0L1 = {data : {source : reFormatText(startKey) + "_BRACKET", target : successorIDsL0L1[i], label : prob}, grabbable : false};
                
                }
                
                graphArr.push(newBranchL0L1)

                //From the first level to the second. For bi-gram models, this is the same word.
                //For tri-and-tetra gram models, use the successorIDsL1L2 array (as we want the source of the branch to be the final word for a given key)
                let newBranchL1L2;
                //Change sources and targets depending on model type
                let sourceNode, targetNode = "";

                //Handle the cases where there is 1, [2, maxNodeSplitSize], and (maxNodeSplitSize, inf) L2 nodes for all graph types.

                //Flag to determine whether to render a single bracket in the center at the end (this is false if we render brackets after splitting nodes)
                let renderBracket = true;

                //A single node/successor cluster
                if (successorIDsL1L2[i].length === 1 || !moreThanOneSuccessor[i]) {
                    
                    if (modelType === "Bi-gram") {
                        sourceNode = successorIDsL0L1[i];
                        targetNode = "BOX_L2_" + i;
                    } else {
                        sourceNode = bracketNodesL1L2[i];
                        targetNode = successorIDsL1L2[i][successorIDsL1L2[i].length - 1]
                    }
                    
                    //Set branch
                    newBranchL1L2 = {data : {source : sourceNode, target : targetNode, label : "1.00"}, grabbable : false};
                
                //When we have multiple L2 successors but can split them into multiple nodes (the box is not necessary)
                //If there is only ONE column of words, remove the box and split each word into an individual node with a branch connected to it
                } else if (successorIDsL1L2[i].length <= Math.min(columnSizes[i], maxNodeSplitSize)) {

                    //Don't render bracket at the end (being rendered in this logic itself)
                    renderBracket = false;

                    //Additionally, re-space all of the L2 nodes for this given L1 successor to take up the maximum amount of space possible    
                    let L2SuccessorNodes = graphArr.filter((data_entry, data_index) =>
                        successorIDsL1L2[i].includes(data_entry["data"]["id"])
                    )

                    //Create a variable to hold the current y position
                    let currYPos = allFirstOrderPositions[i] - maxDeviationSplitL2;

                    //Calculate the increment of currYPos (how much it must change per iteration to evenly space the nodes)
                    const increment = maxDeviationSplitL2 * 2 / (L2SuccessorNodes.length + 1)
                    currYPos += increment;

                    //This is for tri-and-tetra-gram models. Save the previous key such that we can add those nodes to each of the L2 successor nodes that we have split

                    //Save x position
                    const xPos = L2SuccessorNodes[0]["position"]["x"]

                    //Store previous key and number of partitions - the latter will either be 3 or 2
                    let prevKey = "";
                    let nPartitions = 3;
                    
                    if (modelType === "Tri-gram") {
                        prevKey = reFormatText(successorsL1[i]);
                        nPartitions = 2;
                    }
                    else {prevKey = reFormatText(startKey.split(" ")[startKey.split(" ").length - 1] + " " + successorsL1[i])}

                    //Source node - this is a node for bi-gram models and a bracket for tri/tetra-gram models
                    let sourceNode = successorIDsL0L1[i];

                    //Iterate over each L2 successor node
                    for (let x = 0; x < L2SuccessorNodes.length; x++) {

                        //If this is a bi-gram model, simply set the position
                        if (modelType === "Bi-gram") {

                            //Set y-position
                            L2SuccessorNodes[x]["position"]["y"] = currYPos;
                        
                        //For tri-and-tetra-gram models, however, add another node (or another two nodes) corresponding to the previous key
                        } else {

                            //Change source node to bracket
                            sourceNode = bracketNodesL1L2[i];

                            //Determine bracket x-position by figuring out the longest word in the previous chain
                            let word1 = successorsL1[i];
                            let words2 = successorsL1L2[i];
                            words2.push(word1);

                            //Find length of longest word
                            let longestLength = 0;
                            for (let k = 0; k < words2.length; k++) {if (words2[k].length > longestLength) {longestLength = words2[k].length}}

                            //As an extension, add a bracket next to the longest length
                            let newBracketNode = {data : {id : successorIDsL1L2[i][successorIDsL1L2[i].length - 1] + "_BRACKET_" + x, label : "]"}, position : {x: midpoint + maxWrap/2, y : currYPos}, style : {height : 50, width : 25, "font-size" : 70}, grabbable : false};
                            graphArr.push(newBracketNode)

                            //Create a new variable to evenly space nodes amongst the given position
                            let embeddedYPos = currYPos - 45;
                            //Increment
                            const embeddedIncrement = 45 * 2 / (nPartitions + 1)
                            embeddedYPos += embeddedIncrement

                            //Iterate over previous key nodes
                            for (let w  = 0; w < prevKey.split(" ").length; w++) {

                                let keyNode = {data : {id : prevKey.split(" ")[w] + "_L2_MULTIGRAM_HEADER_" + x, label : prevKey.split(" ")[w]}, position : { x : xPos, y : embeddedYPos }, grabbable : false};
                                embeddedYPos += embeddedIncrement;

                                //Add to graph
                                graphArr.push(keyNode);

                            }

                            //Finally, re-draw the actual successor node (where the branch will be pointing to)
                            L2SuccessorNodes[x]["position"]["y"] = embeddedYPos;
                        
                        }   
                        
                        //Get probability and use it to label branch
                        let leftBracketIdx = L2SuccessorNodes[x]["data"]["label"].lastIndexOf("(");
                        let rightBracketIdx = L2SuccessorNodes[x]["data"]["label"].lastIndexOf(")");
                        
                        //Substring
                        let prob = Number(L2SuccessorNodes[x]["data"]["label"].substring(leftBracketIdx + 1, rightBracketIdx)).toFixed(2);

                        //Remove from label
                        L2SuccessorNodes[x]["data"]["label"] = L2SuccessorNodes[x]["data"]["label"].substring(0, leftBracketIdx - 1);
                        
                        //Create branch between L1 node and this one + push to graph
                        let newDirectBranch = {data : {source : sourceNode, target : L2SuccessorNodes[x]["data"]["id"], label : prob}, grabbable : false};
                        graphArr.push(newDirectBranch)

                        //Increment current y position
                        currYPos += increment;

                    }

                //When the L2 nodes must be placed into a box
                //If the other two cases have failed and the model is a bi-gram, this must execute
                //If not a bi-gram, moreThanOneSuccessor[i] must be true for this to execute
                } else if (modelType === "Bi-gram" || moreThanOneSuccessor[i]) {

                    if (modelType === "Bi-gram") {sourceNode = successorIDsL0L1[i];} 
                    else {sourceNode = bracketNodesL1L2[i];}
                    targetNode = "BOX_L2_" + i;

                    //Set branch
                    newBranchL1L2 = {data : {source : sourceNode, target : targetNode, label : ""}, grabbable : false};

                }

                //Add to graph
                if (newBranchL1L2 !== undefined) {graphArr.push(newBranchL1L2);}
                
                //If more than one successor is present, as mentioned earlier, we must add the hanging initial phrases on top of the given branches
                //Also add a bracket from the top of said hanging phrase to the bottom of the bounding box

                if (moreThanOneSuccessor[i] && boxBorderWidth !== 0) {

                    //Use width and y position of the box (remember that if we have more than one successor, a box must be present)
                    //Create node from the hangingInitPhrases array as well as a new bracket
                    //let newHangingNode = {data : {id : hangingInitPhrases[i] + "_HANGING_PHRASE_" + i, label : hangingInitPhrases[i]}, position : {x: (midpoint - (0.5 * boxDist)) - 40, y : allFirstOrderPositions[i] - 25}};
                    let newHangingNode = {data : {id : hangingInitPhrases[i] + "_HANGING_PHRASE_" + i, label : hangingInitPhrases[i]}, position : {x: midpoint, y : allFirstOrderPositions[i] - (height/2) - 25}, grabbable : false};
                    //Add to graph
                    graphArr.push(newHangingNode)

                    if (modelType !== "Bi-gram") {
                        let newBracketNode = {data : {id : successorIDsL0L1[i] + "_BRACKET", label : "]"}, position : {x: midpoint + (boxDist/2) + 25 , y : allFirstOrderPositions[i] - (height/2)}, style : {height : 50, width : 25, "font-size" : 70}, grabbable : false};
                        graphArr.push(newBracketNode)
                    }

                } else {

                    if (modelType !== "Bi-gram" && renderBracket) {

                        //Determine bracket x-position by figuring out the longest word in the previous chain
                        let word1 = successorsL1[i];
                        let words2 = successorsL1L2[i];
                        words2.push(word1);

                        //Find length of longest word
                        let longestLength = 0;
                        for (let k = 0; k < words2.length; k++) {if (words2[k].length > longestLength) {longestLength = words2[k].length}}

                        //Right bound of the bracket will be midpoint + 1/2 of the longest length times the number of pixels occupied by the characters.
                        //The optimal constant can be found through trial and error; but generally, will be between 8 - 20 (divided by two of course)

                        let newBracketNode = {data : {id : successorIDsL1L2[i][successorIDsL1L2[i].length - 1] + "_BRACKET", label : "]"}, position : {x: midpoint + (maxWrap/2), y : allFirstOrderPositions[i]}, style : {height : 50, width : 25, "font-size" : 70}, grabbable : false};
                        graphArr.push(newBracketNode)
                    }
                }
                
            }
        }

        //Set graphData to the graphArr
        setGraphData(graphArr)
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
                grabbable: false,
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
        if (textGenMode === "automatic" && !pane2KeyClicked && nGramDict.size !== 0) {
            renderGraph();
        }

        //The following line suppresses warnings regarding not including some variables in the useEffect dependency array.
        //This is INTENTIONAL - said variables are NOT supposed to influence the given useEffect hook. 
        //eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isReset, generatedText])

    useEffect(() => {
        if (textGenMode === "automatic" && pane2KeyClicked) {
            setPane2KeyClicked(false);
            renderGraph();
        }

        //The following line suppresses warnings regarding not including some variables in the useEffect dependency array.
        //This is INTENTIONAL - said variables are NOT supposed to influence the given useEffect hook. 
        //eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isReset, pane2KeyClicked])


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