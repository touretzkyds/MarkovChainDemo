import React, {useState, useEffect, useRef} from "react";
import CytoscapeComponent from "react-cytoscapejs";
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import { useDictContext } from "./Context";
cytoscape.use(dagre);

//Function
export default function ManualVisualizations() {
    //Get dictionary, generatedText, current word, key, word options, and more from context
    const {nGramDict, modelType, generatedText, currentWord, key, wordOptions, nodesAdded, setNodesAdded} = useDictContext();
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
        //Keys and Nodes
        setKeysAdded([]);
        setNodesAdded([]);
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

    //To add new nodes to the graph
    const addNodes = (add_node) => {
        setNodesAdded(previousNodes => {
            const newNode = add_node;
            const updatedNodes = [...previousNodes, newNode];
            return updatedNodes;
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
        //Add key to node array. Check to make sure that the preceding element is not identical (as this is neither possible nor desired).
        //Duplicates spaced apart are allowed, however.
        if (nodesAdded.length >= 1) {
            //Check if the last element is identical. If not, add/
            if (nodesAdded[nodesAdded.length - 1] !== key) {addNodes(key);}
        } else {addNodes(key);}
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
            //Check that the word has not already been added and that the word is not the key
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
    }

    //Each time a new node is added, delete the unselected options of previous nodes.
    useEffect(() => {
        //Make sure that the length of nodes is greater than 1
        if (nodesAdded.length > 1) {
            //Find the last introduced key
            const previous_key = nodesAdded[nodesAdded.length - 2];
            //Get all non-selected word names associated with the previous key
            let unselected_node_names = [];
            //Iterate over graph data and store
            manualGraph.forEach(data_entry =>{
                //Only consider branch data. Find all target words, being careful not to add the current key itself.
                if ("source" in data_entry["data"] && data_entry["data"]["source"] === previous_key && data_entry["data"]["target"] !== key) {
                    //Ensure that the target word is NOT already a node (which may be the case if the node is being revisited
                    if (!nodesAdded.includes(data_entry["data"]["target"])) {
                        unselected_node_names.push(data_entry["data"]["target"]);
                    }
                }
            })
            //Filter manual graph such that any branches and nodes within the unselected_node_names list are excluded
            //Filter for branches
            let filtered_graph = manualGraph.filter((data_item, data_index) => 
                                                                data_item["data"]["target"] === undefined || unselected_node_names.indexOf(data_item["data"]["target"]) === -1
                                                            );
            //Filter for nodes. Iterate over all unselected node names
            unselected_node_names.forEach(unselected_node => {
                console.log("UNSELECTED NODE SEARCH:", unselected_node);
                manualGraph.forEach(data_entry => {
                    //Verify that the data entry is a node. If it's ID is the unselected node name, remove.
                    if (!("source" in data_entry["data"]) && data_entry["data"]["id"] === unselected_node) {
                        console.log("UNSELECTED NODE REMOVED: ", data_entry["data"]["id"])
                        console.log("FILTERED GRAPH BEFORE:", filtered_graph)
                        filtered_graph = filtered_graph.filter((data_sample, index) => index !== filtered_graph.indexOf(data_entry))
                        console.log("FILTERED GRAPH AFTER:", filtered_graph);
                    }
                })
            })
            //Remove unselected nodes from active. Filter via copy of array first
            const filtered_keys_added = keysAdded.filter((key) => !unselected_node_names.includes(key));
            //Assign filtered keys.
            setKeysAdded(filtered_keys_added);
            //Assign filtered graph to the currently active graph
            setManualGraph(filtered_graph);       
        }

    }, [nodesAdded])


    useEffect(() => {
        console.log("NODES ADDED:", nodesAdded);
    }, [nodesAdded])


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
    }, [manualGraph, graphReset, graphRef.current, currentWord, key, wordOptions])

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