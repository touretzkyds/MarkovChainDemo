import React, {useState, useEffect, useRef} from "react";
import CytoscapeComponent from "react-cytoscapejs";
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import { useDictContext } from "./Context";
cytoscape.use(dagre);

//Function
export default function ManualVisualizations() {
    //Get dictionary, generatedText, current word, key, word options, and more from context
    const {nGramDict, modelType, generatedText, currentWord, key, wordOptions} = useDictContext();
    //Layout and whether it has been built
    const [layout, setLayout] = useState();
    const [layoutBuilt, setLayoutBuilt] = useState(false);
    //Keep track of keys that have already been added to the graph
    const [keysAdded, setKeysAdded] = useState([]);
    //Track whether the graph has been properly reset
    const [graphReset, setGraphReset] = useState(false);
    //Set graph reference, graph data, and style
    let graphRef = React.useRef(null);
    const [manualGraph, setManualGraph] = useState([]);
    const manualGraphStyle = [
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

    //On mount, reset all graph data and text
    useEffect(() => {
        //Set graph reset to false
        setGraphReset(false);
        //Layout
        setLayout();
        setLayoutBuilt(false);
        //Keys
        setKeysAdded([]);
        //Graph data
        setManualGraph([]);
    }, [])

    //Verify that the reset has taken place
    useEffect(() => {
        if (layout === undefined && layoutBuilt === false && keysAdded.length === 0 && manualGraph.length === 0) {
            setGraphReset(true);
        }
    })

    //To add new data points to our graph
    const addDataPoint = (add_data) => {
        setManualGraph(previousGraphData => {
            const newData = add_data;
            const updatedData = [...previousGraphData, newData]
            return updatedData
        })
    }

    //Keep track of all added keys
    const trackAddedKeys = (new_key) => {
        setKeysAdded(previousKeys => {
            const newKey = new_key;
            const updatedKeyData = [...previousKeys, newKey];
            return updatedKeyData;
        })
    }

    //Build manual graph
    const buildManualGraph = () => {
        //Check if the key is not already present in the graph
        //If not, add the key first. Otherwise move straight to populating child nodes
        if (!keysAdded.includes(key)){
            //Add key
            let key_entry = { data : {id : key, label : key}, position : { x:Math.random() * 100 + 50, y: Math.random() * 100 + 50}};
            addDataPoint(key_entry);
            //Track key as being added
            trackAddedKeys(key);
        }
        //Iterate over wordOptions
        wordOptions.forEach(word => {
            //Check that the word has not already been added
            if (!keysAdded.includes(word)) {
                //Add to graph
                let word_entry = { data : {id : word, label : word}, position : { x:Math.random() * 2000 + 50, y: Math.random() * 2000 + 50}}
                addDataPoint(word_entry);
                //Track word
                trackAddedKeys(word);
                //If the word has already been added but is a next-word, still add a branch
                //Add branch between key and word
                let keyWordBranch = { data : {source : key, target : word, label : key + word}}
                addDataPoint(keyWordBranch)
            }
        })
        //Add all wordOptions to the graph
    }

    //Each time the wordOptions change, re-render the graph
    useEffect(() => {
        //Do this only if the key is not none and if reset has been done properly
        if (key !== "" && graphReset) {
            buildManualGraph();
            //Set graph layout
            setLayout({
                name: "dagre",
                fit: true,
                rankDir: "LR",
                // directed: true,
                // circle: false,
                // grid: false,
                avoidOverlap: true,
                spacingFactor: 1.5 + Math.random() * (1.8 - 1.5),
                nodeDimensionsIncludeLabels: true,
                animate: true,
                randomize: false,
                ready: true,
                stop: true,
            });
        }
    }, [graphReset, graphRef.current, currentWord, key, wordOptions])

    //Colour all nodes that have already been generated RED.
    useEffect(() => {
        //Get all words
        let sentence = generatedText.trim().split(" ");
        //Iterate over all words in the sentence
        sentence.forEach(word => {
            //Check that the cytoscape reference is up and running
            if (graphRef.current) {
                //If so, colour the node red
                const cy = graphRef.current._cy;
                cy.nodes('[id=\"' + word + '\"]').style("background-color", "#FF786E");
            } 
        })
    }, [generatedText, graphRef.current])

    //Set the layoutBuilt flag to true if layout has been defined
    useEffect(() => {
        if (layout !== undefined) {
            setLayoutBuilt(true);
        }
    }, [layout])

    return (
        <div className = "manual-visualization-pane" class = "flex h-full w-full">
            {layoutBuilt && <CytoscapeComponent className = "manual-graph" id = "manual-graph" class = "h-full w-full" stylesheet = {manualGraphStyle} elements = {manualGraph} layout = {layout} style = {{width : '100%', height : "100%"}} ref = {graphRef}/>}
        </div>
    )
}