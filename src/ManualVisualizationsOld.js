import React, {useState, useEffect, useRef} from "react";
import CytoscapeComponent from "react-cytoscapejs";
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import euler from 'cytoscape-euler';
import klay from 'cytoscape-klay'
import cise from "cytoscape-cise";
import COSEBilkent from "cytoscape-cose-bilkent";
import { useDictContext } from "./Context";
import { queryAllByLabelText } from "@testing-library/react";
cytoscape.use(dagre);

//Function
export default function ManualVisualizations() {
    //Get dictionary, generatedText, current word, key, word options, and more from context
    const {modelType, generatedText, currentWord, key, wordOptions, enableNextWord, keysAdded, setKeysAdded, clearButtonClicked, setClearButtonClicked} = useDictContext();
    //Layout and whether it has been built
    const [layout, setLayout] = useState();
    const [layoutName, setLayoutName] = useState("dagre");
    const [layoutBuilt, setLayoutBuilt] = useState(false);
    //Keep track of all nodes that have already been added to the graph
    const [nodesAdded, setNodesAdded] = useState([]);
    //Track whether the graph has been properly reset
    const [graphReset, setGraphReset] = useState(false);
    //Set graph reference, graph data, and style
    let graphRef = React.useRef(null);
    const [manualGraph, setManualGraph] = useState([]);
    //A trigger for determining whether adding backwards connections is allowed or not (once per key change)
    let backwardsCnxAllowed = false;
    //A trigger for adding branches for tri-and-tetra-gram models (also once per key change)
    let triTetraBranchAdditionAllowed = false;
    //For triggering updates - increment the variable to re-render the cytoscape graph
    const [updateInt, setUpdateInt] = useState(0);
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
    }, [enableNextWord, modelType])

    useEffect(() => {
        if (clearButtonClicked) {
            setGraphReset(false);
            //Layout
            setLayout();
            setLayoutBuilt(false);
            //Keys and Nodes
            setKeysAdded([]);
            setNodesAdded([]);
            //Graph data
            setManualGraph([]);
            setClearButtonClicked(false);
        }
    }, [clearButtonClicked])

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
    const addKeys = (new_key) => {
        setKeysAdded(previousKeys => {
            const newKey = new_key;
            const updatedKeyData = [...previousKeys, newKey];
            return updatedKeyData;
        })
    }

    //Build manual graph
    const buildManualGraph = () => {

        //Delcare what the word key will be - particularly if the model is a tri-gram or tetra-gram
        // const word_key = key.split(" ")[key.split(" ").length - 1];
        const word_key = key;
        console.log("WORD KEY:", word_key);

        //Verify that the current key is not already a node on the graph
        //If not, add it to the graph
        if (!nodesAdded.includes(key)) {
            //Create data point
            //If the model is a tri-or-tetra gram model, include the previous key in the word label
            let graph_entry = { data : {id : word_key, label : word_key.replace(".", "<PERIOD>").replace("!", "<EXCL>").replace("?", "<Q>").trim()}, position : { x:Math.random() * 100 + 50, y: Math.random() * 100 + 50}};
            //Add to Graph
            addDataPoint(graph_entry);
            //Add to collection of nodesAdded
            addNodes(key);
        }
    
        //Check to see if there are any duplicates of the current key present
        const n_duplicate_keys = keysAdded.COSEBilkent2
        .filter((graph_key) => (graph_key === word_key)).length - 1

        //For Tri-and-Tetra-Gram models, add a branch between the previous key and the current key
        //Do so once per key change
        if ((modelType === "Tri-gram" || modelType === "Tetra-gram") && triTetraBranchAdditionAllowed && keysAdded.length > 1 && n_duplicate_keys < 1) {
            //Declare connection between previous key and current key
            let cnx_branch = {data : {source : keysAdded[keysAdded.length - 2], target : word_key, label : keysAdded[keysAdded.length - 2] + word_key}};
            //Add to graph
            addDataPoint(cnx_branch);
            //Disable additional branches amongst keys (not between keys and options) until a new key has been selected
            triTetraBranchAdditionAllowed = false;
        }

        //React sometimes renders windows multiple times. To prevent multiple renders from adding multiple nodes, ensure that two identical consecutive nodes cannot be placed
        //Verify that the previous key is not identical to the current key
        if (keysAdded.length < 1) {addKeys(word_key);}
        else if (keysAdded[keysAdded.length - 1] !== word_key) {addKeys(word_key);}


        //If duplicates are present add a backwards connection between the current key and the previous one
        //Verify that backwards connections are allowed
        if (n_duplicate_keys >= 1 && backwardsCnxAllowed) {
            //Create backwards connection branch
            let backwards_cnx_branch = {data : {source : keysAdded[keysAdded.length - 2], target : word_key, label : keysAdded[keysAdded.length - 2] + word_key + "BackwardsCnx"}};
            //Add to graph
            addDataPoint(backwards_cnx_branch);
            //Disable future backwards connections until a new key is added
            backwardsCnxAllowed = false;
        }

        //Add all selection options
        wordOptions.forEach(word => {
            //Check that the node has not already been added to the graph
            if (!nodesAdded.includes(word)) {
                //Create a node data point
                //First, establish a label
                let label = word.replace(".", "<PERIOD>").replace("!", "<EXCL>").replace("?", "<Q>").trim();
                //For tri-and-tetra-gram models, add the final word or the last two words of the key at the beginning of each option
                console.log("Model type:", modelType);
                console.log("Keys added:", keysAdded);
                if (modelType === "Tri-gram") {
                    label = key.split(" ").slice(-1).toString().replace(".", "<PERIOD>").replace("!", "<EXCL>").replace("?", "<Q>").trim() + " " + label;
                } else if (modelType === "Tetra-gram") {
                    label = key.split(" ").slice(-2).toString().replace(",", " ").replace(".", "<PERIOD>").replace("!", "<EXCL>").replace("?", "<Q>").trim() + " " + label;
                }
                let word_entry = { data : {id : word, label : label}, position : { x:Math.random() * 2000 + 50, y: Math.random() * 2000 + 50}};
                //Add to the graph
                addDataPoint(word_entry);
                //Add a branch between the current key and final word of the key + the next
                let key_word_branch = { data : {source : word_key, target : word, label : word_key + word}}
                //Add branch to graph
                addDataPoint(key_word_branch);
                //Add word to list of added nodes
                addNodes(word);
            }
        })
        

    }

    //If a new key is added, enable backwards connections and key branches for tri-and-tetra-grams once again
    useEffect(() => {
        backwardsCnxAllowed  = true;
        triTetraBranchAdditionAllowed = true;
    }, [keysAdded])

    //Each time a new node is added, delete the unselected options of previous nodes.
    useEffect(() => {
        //Make sure that the length of the keys is greater than 1
        if (keysAdded.length > 1) {
            //Find the last introduced key
            const previous_key = keysAdded[keysAdded.length - 2];
            //Get all non-selected word names associated with the previous key
            let unselected_node_names = [];
            //Iterate over graph data and store
            manualGraph.forEach(data_entry =>{
                //Only consider branch data. Find all target words, being careful not to add the current key itself.
                if ("source" in data_entry["data"] && data_entry["data"]["source"] === previous_key && data_entry["data"]["target"] !== key) {
                    //Ensure that the target word is NOT already a key (which may be the case if the node is being revisited)
                    if (!keysAdded.includes(data_entry["data"]["target"])) {
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
                manualGraph.forEach(data_entry => {
                    //Verify that the data entry is a node. If it's ID is the unselected node name, remove.
                    if (!("source" in data_entry["data"]) && data_entry["data"]["id"] === unselected_node) {
                        filtered_graph = filtered_graph.filter((data_sample, index) => index !== filtered_graph.indexOf(data_entry))
                    }
                })
            })
            //Remove unselected nodes from active. Filter via copy of array first
            const filtered_keys_added = nodesAdded.filter((key) => !unselected_node_names.includes(key));
            //Assign filtered keys.
            setNodesAdded(filtered_keys_added);
            //Assign filtered graph to the currently active graph
            setManualGraph(filtered_graph);       
        }

    }, [keysAdded])

    //Each time the wordOptions change, re-render the graph
    useEffect(() => {
        //Do this only if the key is not none and if reset has been done properly
        if (key !== "" && graphReset) {
            buildManualGraph();
            //Set graph layout
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
        }
    }, [graphReset, key, wordOptions, updateInt])


    //Colour all nodes that have already been generated RED.
    useEffect(() => {
        //Iterate over all nodes
        manualGraph.forEach(data_entry => {
            //Check that the cytoscape reference is up and running
            if (graphRef.current && !("source" in data_entry["data"])) {
                const word = data_entry["data"]["id"]
                const cy = graphRef.current._cy;
                //Colour the node depending on whether the word is a key or a wordOption
                if (word === key) {
                    cy.nodes('[id=\"' + word + '\"]').style("background-color", "#14532D");
                    cy.nodes('[id=\"' + word + '\"]').style("color", "white");
                } else if (wordOptions.includes(word)) {
                    cy.nodes('[id=\"' + word + '\"]').style("background-color", "#FF786E");
                    cy.nodes('[id=\"' + word + '\"]').style("color", "black");
                } else {
                    cy.nodes('[id=\"' + word + '\"]').style("background-color", "#ADD8E6");
                    cy.nodes('[id=\"' + word + '\"]').style("color", "black");
                }

            } 
        })
        //Trigger update
        let current_int = updateInt;
        setUpdateInt(current_int + 1);
    }, [manualGraph, wordOptions, generatedText, graphRef.current])

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