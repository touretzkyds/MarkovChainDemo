import React, {useState, useEffect, useRef} from "react";
import CytoscapeComponent from "react-cytoscapejs";
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import euler from 'cytoscape-euler';
import klay from 'cytoscape-klay'
import cise from "cytoscape-cise";
import COSEBilkent from "cytoscape-cose-bilkent";
import { useDictContext } from "./Context";
import ManualVisualizations from "./ManualVisualizations";
cytoscape.use(COSEBilkent);

export default function Visualizations() {
    //Get N Gram Dictionary, Branching Factor, and Number of Entries from Context
    const {autoGraphAllowed, setAutoGraphAllowed, wordCount, generatedText, nGramDict, modelType, setModelType, textGenMode, setTextGenMode, generateText} = useDictContext();
    const [graphData, setGraphData] = useState([]);
    //Keep Track of all the words added to the graph
    const [wordsAdded, setWordsAdded] = useState([]);
    //Layout
    const [layout, setLayout] = useState();
    const [layoutBuilt, setLayoutBuilt] = useState(false);
    //Graph
    const [graph, setGraph] = useState();
    //Keep reference to the cytoscape graph element to check if it has been rendered
    const cytoRef = useRef(null);

    const cyStyle = [
        {
            selector: "node",
            style : {
                'background-color': '#ADD8E6', // Node background color
                'label': 'data(label)', // Display the node's label
                'shape': 'ellipse', // Node shape
                'width': '100px', // Node width
                'height': '100px', // Node height
                'font-size': '20px', // Label font size
                'text-valign': 'center', // Vertical alignment of label
                'text-halign': 'center', // Horizontal alignment of label
                'text-wrap' : 'wrap',
                'text-max-width' : "100px"
            }
        },
        {
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

    //Add new data point (node or branch)
    const addDataPoint = (add_data) => {
        setGraphData(previousData => {
            const newData = add_data;
            const updatedData = [...previousData, newData];
            return updatedData
        })
    }
    
    //Track a new word
    const trackNewWord = (word) => {
        setWordsAdded(previousWords => {
            const newWord = word;
            const updatedWords = [...previousWords, newWord];
            return updatedWords
        })
    }

    //Allow for the graph to be generated if the word count or model type changes
    useEffect(() => {
        if (wordCount !== 100) {
            setAutoGraphAllowed(true);
            const yeet = ""
        } 
    }, [wordCount])

    useEffect(() => {
        setAutoGraphAllowed(true);
        console.log("Generated Text When Model Type Changed:", generatedText)
    }, [modelType, generatedText])

    //If no text is being displayed, erase the graph
    useEffect(() => {
        if (generatedText == "") {
            //Create array to house graph words while the state is being updated
            setWordsAdded([]);
            setGraphData([]);
        }
    }, [generatedText])

    const buildGraph = () => {
        if (autoGraphAllowed && generatedText !== "") {
            //Clear existing wordsAdded array
            console.log("GENERATED TEXT", generatedText.split(" "));
            //Create array to house graph words while the state is being updated
            let wordArray = [];
            setWordsAdded([]);
            setGraphData([]);
            //For each model, set a different words_before_end limit (what index the graph should stop iterating at)
            //Critical and dependant on key length
            let words_before_end = 0;
            if (modelType === "Tri-gram") {words_before_end = 1;}
            else if (modelType === "Tetra-gram") {words_before_end = 2};
            //Iterate over generated text
            for (var i = 0; i < (generatedText.split(" ").length - words_before_end); i++) {
                //Set textWord
                let textWord = "";
                if (modelType === "Bi-gram") {textWord = generatedText.split(" ")[i];}
                else if (modelType === "Tri-gram") {textWord = generatedText.split(" ")[i] + " " + generatedText.split(" ")[i + words_before_end];}
                else if (modelType === "Tetra-gram") {textWord = generatedText.split(" ")[i] + " " + generatedText.split(" ")[i + 1] + " " + generatedText.split(" ")[i + 2];}
                //Add Root Node if not already present and if the textWord is not simply an empty string
                if (!wordsAdded.includes(textWord) && textWord !== "") {
                    console.log("ADDING")
                    let newEntry = { data : {id : textWord, label: textWord.replace(".", "<PERIOD>").replace("!", "<EXCL>").replace("?", "<Q>").trim()}, position: { x:Math.random() * 3000 + 50, y: Math.random() * 3000 + 50}}
                    addDataPoint(newEntry);
                    //Add to wordsAdded
                    trackNewWord(textWord);
                    //Add to wordArray
                    wordArray.push(textWord);
                }
                //If this is not the first word, add a branch between the current and previous node
                if (wordArray.length > 1) {
                    //Declare connection between previous key and current key
                    let cnx_branch = {data : {source : wordArray[wordArray.length - 2], target : textWord, label : wordArray[wordArray.length - 2] + textWord}};
                    //Add to graph
                    addDataPoint(cnx_branch);  
                }
            }
            //Disable auto graph generation until the generate text button is explicitly clicked
            setAutoGraphAllowed(false);
        }
    }

    //When Mounting, change the graph based off of the data
    useEffect(() => {
        buildGraph();
        //Set graph layout
        setLayout({
            name: "cose-bilkent",
            fit: true,
            rankDir: "LR",
            directed: false,
            circle: true,
            // grid: false,
            avoidOverlap: true,
            spacingFactor: 1.5 + Math.random() * (1.8 - 1.5),
            nodeDimensionsIncludeLabels: true,
            animate: "end",
            gravity : 1,
            randomize: false,
            ready: true,
            stop: true,
            klay : {
                addUnnecessaryBendpoints: true,
                mergeHierarchyCrossingEdges: false,
                direction : "RIGHT",
                // crossingMinimization: "INTERACTIVE",
                feedbackEdges: true,
                mergeEdges : true,
                //nodePlacement : "LINEAR_SEGMENTS"
            }
        });

    }, [generatedText, nGramDict, modelType, autoGraphAllowed])

    useEffect(() => {
        if (layout !== undefined) {
            setLayoutBuilt(true);
        }
    }, [layout])

    //Render
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
                {layoutBuilt && textGenMode === "automatic" && <CytoscapeComponent className = "cyto-graph" class = "h-full w-full" ref = {cytoRef} id = "cyto-graph" stylesheet = {cyStyle} elements = {graphData} layout = {layout} style = {{width : '100%', height : "100%"}}/>}
                {layoutBuilt && textGenMode === "manual" && <ManualVisualizations />}
                {!layoutBuilt && <div className = "loading" class = "flex h-full w-full text-center align-center items-center justify-center">Loading...</div>}
            </div>
        </div>
    )
}