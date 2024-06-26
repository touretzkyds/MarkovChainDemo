import React, {useState, useEffect} from "react";
import CytoscapeComponent from "react-cytoscapejs";
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import { useDictContext } from "./Context";

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
           setCurrentWord, setKey, setKeysAdded, wordOptions, clearButtonClicked, setClearButtonClicked} = useDictContext();

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
    let maxDeviationYL1 = -350;
    let maxDeviationXL1 = 140;
    let maxDeviationYL2 = 25;
    let maxDeviationXL2 = maxDeviationXL1 + 40;
    
    //Node width and height
    const nodeWidth = 150;
    const nodeHeight = 50;

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
                'text-max-width' : nodeWidth + 20,
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
                "text-margin-y" : "-20"
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
                
                //Check to see if the generated text is long enough, if not, then use as start key without additional concerns
                if (true || generatedText.trim(" ").split(" ").length <= n) {
                    startKey = generatedText.trim(" ").split(" ").slice(-n).join(" ");
                }
                //If the generated text is longer, however, the start key will be two n behind (this is temporarily disabled)
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

                //Otherwise, pick a word from the dictionary at random, add to graph (if not already present) and added node list
                //startKey = dictKeys[Math.floor(Math.random() * dictKeys.length)];
        }



        if (startKey === undefined || startKey === null || startKey === "") {return}

        if (!startKey.split(" ").includes("undefined")) {

            //For bi-gram models, simply place the word at 0,0
            //For non-bi-gram models, stack words vertically 
            let newGraphPoint;
            if (modelType === "Bi-gram") {

                //Create node and push
                newGraphPoint = {data : {id : reFormatText(startKey), label : reFormatText(startKey)}, position : {x:0}};
                setGraphData(existingGraph => [...existingGraph, newGraphPoint]);
            
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
                    let newStartNode = {data : {id : words[i] + "_START", label : words[i]}, position : {x : 0, y : startYCoord}, style : {"font-weight" : style}};
                    //Add to the graph
                    setGraphData(existingGraph => [...existingGraph, newStartNode]);

                }

                //Add a bracket node to the graph
                //Create bracket node
                let newBracketNode = {data : {id : reFormatText(startKey) + "_BRACKET", label : "]"}, position : {x: 0 + 50, y : 0}, style : {height : 50, width : 25, "font-size" : 90}};
                //Add to graph
                setGraphData(existingGraph => [...existingGraph, newBracketNode]);
                 
                //Iterate through each, display
                //newGraphPoint = {data : {id : reFormatText(startKey), label : reFormatText(startKey)}, position : {x:Math.random()}};
            }

            allAddedNodes.push(startKey);

        }

        //Iterate through each successor word
        //If the word has no further successors, create a second node titled "END OF CHAIN"
        if (nGramDict.get(startKey) === undefined) {return;}
        let successorsL1 = Array.from(nGramDict.get(startKey));
        successorsL1 = successorsL1.map(function (pair) {return pair[0];})
        
        //2D array of all L1L2 successors
        let successorsL1L2 = [];

        //Array of all L0L1 successor IDs (needed for the branches going from the root word to the first level)
        let successorIDsL0L1 = [];
        //Array of all L1L2 successor IDs (for the branches going from L1 to L2)
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

        //Array 

        // //If not rendering second-order successors, set a max row height and optimize width
        // if (!renderSecondOrderSuccessors) {

        //     let maxFirstOrderRows = 14;
        //     let counter = 0;
        //     let columnCounter = 0;

        //     for (let i = 0; i < successorsL1.length; i++) {
                
        //         //Get value
        //         let unformattedSuccessor = successorsL1[i];
        //         let successor = reFormatText(unformattedSuccessor);

        //         if (counter % maxFirstOrderRows === 0 && counter !== 0) {
        //             xCoordinateL1 += maxDeviationXL2;
        //             let rowsInColumn = maxFirstOrderRows;

        //             if (Math.floor(successorsL1.length / maxFirstOrderRows) === columnCounter + 1) {
        //                 rowsInColumn = Math.floor(successorsL1.length % maxFirstOrderRows);
        //             }

        //             yCoordinateL1 = 0 - ((rowsInColumn + 1) * (maxDeviationYL2 / 2));
        //             counter = 0;
        //             columnCounter++;
        //         }

        //     }
    
        // }

        let maxFirstOrderRows = 14;
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

                    yCoordinateL1 = 0 - ((rowsInColumn + 1) * (maxDeviationYL2 / 2));
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
                yCoordinateL1 += (Math.abs(-170) * 2 / (maxColumnNodes + 1));
            }

            //Check how many times the successor as already been added
            let successorCount = allAddedNodes.filter(node => node === successor).length.toString();

            //Generate a node label depending on the model type
            let nodeLabel = successor;
            if (modelType === "Tri-gram") {nodeLabel = reFormatText(startKey.split(" ")[startKey.split(" ").length - 1] + " " + successor);}
            else if (modelType === "Tetra-gram") {nodeLabel = reFormatText(startKey.split(" ")[startKey.split(" ").length - 2] + " " + startKey.split(" ")[startKey.split(" ").length - 1] + " " + successor);}
            
            //Add jitter if second-order successors are not being rendered
            //If we are dealing with a bi-or-tri-gram model, arrange each word vertically and store.
            //console.log("SECOND ORDER SUCCESSORS BEING RENDERED:", renderSecondOrderSuccessors);
            if (!renderSecondOrderSuccessors) { //&& maxFirstOrderSuccessors > 1

                if (modelType === "Bi-gram") {

                    //Jittered version is commented out; feel free to uncomment it if you'd like to add it back in (and comment the first line instead)
                    //Include probability of occurrence in the label
                    let prob = nGramDict.get(startKey).get(unformattedSuccessor);
                    let newGraphPoint = {data : {id : successor + successorCount, label : nodeLabel + " (" + prob + ")"}, position : {x: xCoordinateL1, y : yCoordinateL1}};
                    //let newGraphPoint = {data : {id : successor + successorCount, label : nodeLabel}, position : {x: xCoordinateL1 + Math.floor(Math.random() * (jitterX * 2 + 1) - jitterX), y : yCoordinateL1 + Math.floor(Math.random() * (jitterY * 2 + 1) - jitterY)}};
                    
                    //
                    
                    setGraphData(existingGraph => [...existingGraph, newGraphPoint]);

                } else {

                    //Get words
                    let words = nodeLabel.split(" ");

                    //Store currently available y-coordinate. For tri-gram models, evenly split the words around the central axis. For tetra-gram models, 
                    //split all three around the given axis.
                    //Assume a maximum sub-y deviation of 30 px
                    let maxTriTetraYDeviation = 0;
                    let triTetraYCoord = yCoordinateL1 - maxTriTetraYDeviation;

                    //Variable to determine number of required partitions
                    let n = 0;
                    if (modelType === "Tri-gram") {n = 2;}
                    else {n = 3;}

                    //Arrange y coordinate accordingly
                    //triTetraYCoord += (Math.abs(maxTriTetraYDeviation) * 2 / (n + 1));

                    //Create a node from the first word
                    let newFirstWordPoint = {data : {id : successor + successorCount + "_WORD_" + 0, label : words[0]}, position : {x: xCoordinateL1, y : triTetraYCoord}};

                    //Update y-coordinate
                    //triTetraYCoord += (Math.abs(maxTriTetraYDeviation) * 2 / (n + 1));

                    //Create a node from the last two words, immediately below the first
                    //For a tri-gram model, add the next word. For a tetra-gram model, add the next two words.
                    let newEndWordsPoint;
                    if (modelType === "Tri-gram") {
                        newEndWordsPoint = {data : {id : successor + successorCount + "_WORD_" + 1, label : words[1] + " (" + nGramDict.get(unFormatText(startKey)).get(unFormatText(words[1])) + ")"}, position : {x: xCoordinateL1, y : triTetraYCoord}, style : {"font-weight" : "bold"}};
                    } else {
                        newEndWordsPoint = {data : {id : successor + successorCount + "_WORD_" + 1, label : words[1] + " " + words[2]}, position : {x: xCoordinateL1, y : triTetraYCoord + 15}, style : {"font-weight" : "bold"}};
                    }

                    //Add as the end point for the L0L1 branch and the start of the L1L2 branch
                    //successorIDsL1L2.push(successor + successorCount + "_WORD_" + 1);

                    //No brackets should be added to L1 nodes if no L2 successors are present.

                    //Add both branches and the bracket node to the graph
                    //setGraphData(existingGraph => [...existingGraph, newFirstWordPoint]);
                    setGraphData(existingGraph => [...existingGraph, newEndWordsPoint]);


                }

            } else {

                if (modelType === "Bi-gram") {

                    let newGraphPoint = {data : {id : successor + successorCount, label : nodeLabel}, position : {x : xCoordinateL1, y: yCoordinateL1}};
                    setGraphData(existingGraph => [...existingGraph, newGraphPoint]);
                
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
                        let newTriTetraPoint = {data : {id : successor + successorCount + "_WORD_" + i, label : words[i]}, position : {x: xCoordinateL1, y : triTetraYCoord}, style : {"font-weight" : style}};

                        //Add to the graph
                        setGraphData(existingGraph => [...existingGraph, newTriTetraPoint])
                        
                        //If this is the final word, add to the successorIDsL0L1 list
                        if (i === words.length - 1) {
                            successorIDsL0L1.push(successor + successorCount + "_WORD_" + i);
                        }

                    }

                    //Create bracket node and add to graph
                    let newBracketNode = {data : {id : successor + successorCount + "_BRACKET", label : "]"}, position : {x: xCoordinateL1 + 50, y : yCoordinateL1}, style : {height : 50, width : 25, "font-size" : 90}};
                    setGraphData(existingGraph => [...existingGraph, newBracketNode]);

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
            if (nGramDict.get(secondOrderKey) === undefined) {return;}
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
            let maxRows = 14;

            //Alter the maximum number of rows based on the # of L1 successors
            //The deviation from 14 rows for a given number of L1 successors, x, is f(x) = -2(x-5)
            if (maxFirstOrderSuccessors !== 1) {maxRows = 12 + (-2 * (maxFirstOrderSuccessors - 5));}

            let totalL2Columns = {};
            //For keeping track of what the current number of rows are
            let currRows = 0;


            //Populate the array with the maximum lengths for each set
            let numL1Successors = columnSizes.length;
            for (let i = 0; i < numL1Successors; i++) {

                //Get the length

                //console.log("INTENDED VALUE:", successorL2Lengths[i] / columnSizes[i])
                totalL2Columns[i] = Math.floor(successorL2Lengths[i] / columnSizes[i]);
                //If a remainder is present, add one
                if (successorL2Lengths[i] % columnSizes[i] !== 0) {totalL2Columns[i]++;}
                //Add the column sizes (# of words per column) iteratively to see how many row slots have been occupied
                //If there's only one column, add the length of the successors
                if (successorL2Lengths[i] < columnSizes[i]) {currRows += successorL2Lengths[i];}
                else {currRows += columnSizes[i];}
                
            }

            //console.log("TOTAL L2 COLUMNS:", totalL2Columns);
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

                //console.log("SUCCESSOR L2 AT HIGHEST IDX:", totalL2Columns[highestIdx])

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

        //Now, that all of the positions have been determined render all second-order successors.
        for (let i = 0; i < maxFirstOrderSuccessors; i++) {

            let unformattedSuccessor = successorsL1[i];
            let successor = reFormatText(unformattedSuccessor);

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

            //Second order successors
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
            // console.log("INITIAL MORE THAN ONE SUCCESSOR ASSIGNMENT:", moreThanOneSuccessor[i]);

            //L2 Successor Length (store in array as well)
            let l2SuccessorLength = successorsL2.length;
            successorL2Lengths.push(l2SuccessorLength);
        
            //Store successors in 2D array for box ID creation
            successorsL1L2.push([]);

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
                    prob = nGramDict.get(startKey.split(" ")[startKey.split(" ").length - 1] + " " + unformattedSuccessor).get(successorL2);
                } else {
                    prob = nGramDict.get(startKey.split(" ")[startKey.split(" ").length - 2] + " " + startKey.split(" ")[startKey.split(" ").length - 1] + " " + unformattedSuccessor).get(successorL2);
                }
                
                if (modelType === "Bi-gram") {
                    if (originalSuccessorL2length === 1) {
                        newGraphPointL2 = {data : {id : successorL2 + successorCountL2, label : successorL2}, position : {x: xCoordinateL2, y : yCoordinateL2}};
                    } else {
                        newGraphPointL2 = {data : {id : successorL2 + successorCountL2, label : successorL2 + " (" + prob + ")"}, position : {x: xCoordinateL2, y : yCoordinateL2}};
                    }
                } else {
                    //If the probability is undefined (meaning it is not the final word in the sequence; not a successor word), simply generate the node as is. Otherwise, display the probability
                    if (prob === undefined || (modelType === "Tri-gram" && originalSuccessorL2length === 1) || (modelType === "Tetra-gram" && originalSuccessorL2length === 1)) {
                        newGraphPointL2 = {data : {id : successorL2 + successorCountL2, label : successorL2}, position : {x: xCoordinateL2, y : yCoordinateL2}, style : {"font-weight" : style}};
                    } else {
                        newGraphPointL2 = {data : {id : successorL2 + successorCountL2, label : successorL2 + " (" + prob + ")"}, position : {x: xCoordinateL2, y : yCoordinateL2}, style : {"font-weight" : style}};
                    }
                }
                
                setGraphData(existingGraph => [...existingGraph, newGraphPointL2]);
                allAddedNodes.push(successorL2);
                counterL2++;

                //If there is only one successor (keep in mind that the final words of the previous key have been added to successorsL2.length), add the final word to successorIDsL1L2 array
                if (!moreThanOneSuccessor[i] && j === successorsL2.length - 1) {
                    successorIDsL1L2.push(successorL2 + successorCountL2);
                //Otherwise, push an empty string (blank)
                } else if (moreThanOneSuccessor[i] && j === successorsL2.length - 1){successorIDsL1L2.push("");}
                

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
            // if (modelType === "Bi-gram") {

            //     if (successorsL1.length < maxFirstOrderRows) {height = successorsL1.length * 30}
            //     else {height = maxFirstOrderRows * 30;}

            // } else {

            //     if (successorsL1.length < maxFirstOrderRows) {height = Math.abs(successorsL1.length * maxDeviationYL1 * 0.3)}
            //     else {height = Math.abs(maxFirstOrderRows * maxDeviationYL1 * 0.3);}

            // }


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
                    height : height,
                    shape : "roundrectangle",
                    'background-color' : "F5F5F5",
                    "background-opacity" : 100,
                    "border-width" : 3,
                    "border-color" : "black",
                }
            }

            //Add box to graph
            setGraphData(existingGraph => [...existingGraph, boundingBox])

            //Add branches - include "BRACKET" tag if a tri-or-tetra-gram model
            let newBranchL1;
            if (modelType === "Bi-gram") {
                newBranchL1 = {data : {source : reFormatText(startKey), target : "BOX_L1", label : ""}};
            } else {
                newBranchL1 = {data : {source : reFormatText(startKey) + "_BRACKET", target : "BOX_L1", label : ""}};
            }
            
            setGraphData(existingGraph => [...existingGraph, newBranchL1]);

            //If this is a tri-or-tetra gram model, add the last word of the start key to the top of the box along with a bracket
            if (modelType !== "Bi-gram") {

                //Get last word of the start key
                const topWord = startKey.split(" ")[startKey.split(" ").length - 1];

                //Create top word node
                let newTopNode = {data : {id : topWord + "_TOP_PHRASE", label : topWord}, position : {x: midpoint, y : -height/2 - 25}};
                //Create bracket node
                let newBracketNode = {data : {id : topWord + "_BRACKET", label : "]"}, position : {x: midpoint + ((rightPos - leftPos))/2 + 25 , y : - (height/2)}, style : {height : 50, width : 25, "font-size" : 90}};

                //Add nodes to graph
                setGraphData(existingGraph => [...existingGraph, newTopNode]);
                setGraphData(existingGraph => [...existingGraph, newBracketNode]);
                
            }
        
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
                
                // if (modelType !== "Bi-gram") {

                //     //Calculate outer left bound for the outer box
                //     outerLeftPos = 3 * maxDeviationXL2 - (boundingBoxPadding * nodeWidth);

                //     const innerBoxDist = Math.abs(rightPos - leftPos);
                //     const innerMidpoint = (rightPos + leftPos) / 2;

                //     //Create the inner box
                //     //Set the actual L2 bounding box
                //     const innerBoundingBox = {
                //         "group" : "nodes",
                //         data : {id : "BOX_L2_INNER_" + i, label : ""},
                //         position : {
                //             x : innerMidpoint,//(maxWidths[i] - (3 * maxDeviationXL2))/2 + (3 * maxDeviationXL2),//(((100 + maxWidths[i]) - (3 * maxDeviationXL2)) / 2) + 3 * maxDeviationXL1,
                //             y: allFirstOrderPositions[i],
                //         },
                //         style : {
                //             width : innerBoxDist - 50 + "px",//(maxWidths[i] - (3 * maxDeviationXL2)) + ((maxWidths[i] - (3 * maxDeviationXL2)) / 2),//(maxWidths[i] + 50) - ((3 * maxDeviationXL2) - 50),//(100 * (L2ColumnsPerRow[i] + 1)) + (maxDeviationXL2 * (L2ColumnsPerRow[i])),
                //             height : (columnSizes[i] + 1) * 40,//(columnSizes + 1) * 25 + 20,
                //             shape : "roundrectangle",
                //             'background-color' : "white",
                //             "background-opacity" : 0,
                //             "border-width" : 3,
                //             "border-color" : box_color,
                //             "z-index" : 9999
                //         }
                //     }

                //     //Add box to graph
                //     setGraphData(existingGraph => [...existingGraph, innerBoundingBox])

                //     //Set box colour to white if the model is not a bi-gram one
                //     box_color = "white";

                // }

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

                    if (box_color === "white" && modelType === "Bi-gram") {height = 77;}
                    else {height = numWordsHighest * 25};

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
            
                }

                //Create branches

                //From the source word to the first level
                //For tri-and-tetra-gram models, the target should be the successorIDsL1L2 array element for the given set
                let newBranchL0L1;

                //Get the associated probability between the start and L0L1 word

                let L0L1word = unFormatText(successorIDsL0L1[i].replace(/\d+$/, ''));
                if (modelType === "Bi-gram") {

                    //First, remove all numbers from the right side of the string to extract the L01L1 word
                    L0L1word = unFormatText(successorIDsL0L1[i].replace(/\d+$/, ''));
                    //Get probability
                    let prob = nGramDict.get(startKey).get(L0L1word);
                    newBranchL0L1 = {data : {source : reFormatText(startKey), target : successorIDsL0L1[i], label : prob}};
                
                } else if (modelType === "Tri-gram") {

                    let prob = nGramDict.get(startKey).get(successorsL1[i]);
                    newBranchL0L1 = {data : {source : reFormatText(startKey) + "_BRACKET", target : successorIDsL0L1[i], label : prob}};
                
                } else {

                    let prob = nGramDict.get(startKey).get(successorsL1[i]);
                    newBranchL0L1 = {data : {source : reFormatText(startKey) + "_BRACKET", target : successorIDsL0L1[i], label : prob}};
                
                }
                
                setGraphData(existingGraph => [...existingGraph, newBranchL0L1]);

                //From the first level to the second. For bi-gram models, this is the same word.
                //For tri-and-tetra gram models, use the successorIDsL1L2 array (as we want the source of the branch to be the final word for a given key)
                let newBranchL1L2;

                if (modelType === "Bi-gram") {
                    if (successorL2Lengths[i] > 1) {
                        newBranchL1L2 = {data : {source : successorIDsL0L1[i], target : "BOX_L2_" + i, label : ""}};
                    } else {
                        newBranchL1L2 = {data : {source : successorIDsL0L1[i], target : "BOX_L2_" + i, label : "1"}};
                    }
                    
                } else {

                    //If there is only one L2 successor, point directly to the final word.
                    if (!moreThanOneSuccessor[i]) {
                        newBranchL1L2 = {data : {source : bracketNodesL1L2[i], target : successorIDsL1L2[i], label : "1"}};
                    //Otherwise, point to the box.
                    } else {
                        newBranchL1L2 = {data : {source : bracketNodesL1L2[i], target : "BOX_L2_" + i, label :  ""}};
                    }
                }
                
                setGraphData(existingGraph => [...existingGraph, newBranchL1L2]);

                //If more than one successor is present, as mentioned earlier, we must add the hanging initial phrases on top of the given branches
                //Also add a bracket from the top of said hanging phrase to the bottom of the bounding box

                if (moreThanOneSuccessor[i]) {

                    //Use width and y position of the box (remember that if we have more than one successor, a box must be present)
                    //Create node from the hangingInitPhrases array as well as a new bracket
                    //let newHangingNode = {data : {id : hangingInitPhrases[i] + "_HANGING_PHRASE_" + i, label : hangingInitPhrases[i]}, position : {x: (midpoint - (0.5 * boxDist)) - 40, y : allFirstOrderPositions[i] - 25}};
                    let newHangingNode = {data : {id : hangingInitPhrases[i] + "_HANGING_PHRASE_" + i, label : hangingInitPhrases[i]}, position : {x: midpoint, y : allFirstOrderPositions[i] - (height/2) - 25}};
                    //Add to graph
                    setGraphData(existingGraph => [...existingGraph, newHangingNode]);

                    if (modelType !== "Bi-gram") {
                        let newBracketNode = {data : {id : successorIDsL0L1[i] + "_BRACKET", label : "]"}, position : {x: midpoint + (boxDist/2) + 25 , y : allFirstOrderPositions[i] - (height/2)}, style : {height : 50, width : 25, "font-size" : 90}};
                        setGraphData(existingGraph => [...existingGraph, newBracketNode]);
                    }

                } else {
                    if (modelType !== "Bi-gram") {

                        //Determine bracket x-position by figuring out the longest word in the previous chain
                        let word1 = successorsL1[i];
                        let words2 = successorsL1L2[i];
                        words2.push(word1);

                        //Find length of longest word
                        let longestLength = 0;
                        for (let k = 0; k < words2.length; k++) {if (words2[k].length > longestLength) {longestLength = words2[k].length}}

                        //Right bound of the bracket will be midpoint + 1/2 of the longest length times the number of pixels occupied by the characters.
                        //The optimal constant can be found through trial and error; but generally, will be between 8 - 20 (divided by two of course)

                        let newBracketNode = {data : {id : successorIDsL1L2[i] + "_BRACKET", label : "]"}, position : {x: midpoint + (longestLength * 10), y : allFirstOrderPositions[i]}, style : {height : 50, width : 25, "font-size" : 90}};
                        setGraphData(existingGraph => [...existingGraph, newBracketNode]);
                    }
                }
                
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