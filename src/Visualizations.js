import React, {useState, useEffect, useRef} from "react";
import CytoscapeComponent from "react-cytoscapejs";
import cytoscape from 'cytoscape';
import COSEBilkent from 'cytoscape-cose-bilkent';
import { useDictContext } from "./Context";
import ManualVisualizations from "./ManualVisualizations";
cytoscape.use(COSEBilkent);

export default function Visualizations() {
    //Get N Gram Dictionary, Branching Factor, and Number of Entries from Context
    const { userID, setUserID, nGramDict, modelType, setModelType, textGenMode, setTextGenMode, generateText} = useDictContext();
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
                'text-halign': 'center' // Horizontal alignment of label
            }
        },
        {
            selector: 'edge', // Apply the style to all edges
            style: {
                'width': 11, // Edge width
                'line-color': '#ccc' // Edge color
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

    //Build Graph Function
    const buildGraph = () => {
        if (true){
            //Iterate over the nGram dictionary
            for (const [nodeWord, branchWords] of Object.entries(nGramDict)){
                //Add Root Node
                let newEntry = { data : {id : nodeWord, label: nodeWord}, position: { x:Math.random() * 3000 + 50, y: Math.random() * 3000 + 50}}
                addDataPoint(newEntry);
                //Add to wordsAdded
                trackNewWord(nodeWord);
                //Add branch nodes
                branchWords.forEach(branchWord => {
                    //Check if the word has not already been added to the graph
                    if (!wordsAdded.includes(branchWord)){
                        //Add child node to graph
                        let childNodeEntry = { data : {id : branchWord, label: branchWord}, position: { x:Math.random() * 3000 + 50, y:Math.random() * 3000 + 50}}
                        addDataPoint(childNodeEntry)
                        //Add new branch between parent and child
                        let parentChildBranch = { data : {source: nodeWord, target : branchWord, label : nodeWord + branchWord}}
                        addDataPoint(parentChildBranch);
                        //Add word to list of tracked words
                        trackNewWord(branchWord);
                    }
                })

            }
        }

    }

    //When Mounting, change the graph based off of the data
    useEffect(() => {
        buildGraph();
        setLayout({
            name: "concentric",
            fit: true,
            avoidOverlap: true,
            spacingFactor: 1.7,
            nodeDimensionsIncludeLabels: true,
            animate: true,
            randomize: false,
            ready: true,
            stop: true,
    
        });

    }, [nGramDict])

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
                {/* {layoutBuilt && textGenMode === "manual" && modelType !== "Bi-gram" && <CytoscapeComponent className = "cyto-graph" class = "h-full w-full" ref = {cytoRef} id = "cyto-graph" stylesheet = {cyStyle} elements = {graphData} layout = {layout} style = {{width : '100%', height : "100%"}}/>} */}
                {layoutBuilt && textGenMode === "manual" && <ManualVisualizations />}
                {!layoutBuilt && <div className = "loading" class = "flex h-full w-full text-center align-center items-center justify-center">Loading...</div>}
            </div>
        </div>
    )
}