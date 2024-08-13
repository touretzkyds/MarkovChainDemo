//Create new context to house all visualization-related functions
import React, {createContext, useState, useEffect, useContext} from 'react';
//Use dict context
import { useDictContext } from "./Context";

//Context
const VisContext = createContext();

//Export context hook
export const useVisContext = () => useContext(VisContext);

//Define the actual context (access wrapper)
export const VisContextProvider = ({ children }) => {

    //Get all necessary variables from Dict context
    // const {nGramDict, modelType, textGenMode, generatedText, reFormatText, 
    //        pane2KeyClicked, setPane2KeyClicked, globalStartKey, manualStartKey, setManualStartKey,
    //        setCurrentWord, setKey, graphData, setGraphData, setKeysAdded, 
    //        wordOptions, clearButtonClicked, setClearButtonClicked} = useDictContext();
    const {reFormatText} = useDictContext();

    //Bracket size
    const bracketSize = 70;

    // ======================= BASIC ACTION FUNCTIONS =======================

    //Define a node and add it to a given array of data
    const renderNode = (dataArr, id, label, x, y, fontWeight) => {

        //Define node and add to dataArr
        const newNode = {data : {id : id, label : label}, position : { x : x, y : y}, style : {"font-weight" : fontWeight}, grabbable : false};
        dataArr.push(newNode);

    }

    //Define and render a bracket
    const renderBracket = (dataArr, id, x, y, height, width) => {

        const newBracket = {data : {id : id, label : "]"}, position : {x : x, y : y}, style : {height : height, width : width, "font-size" : bracketSize}, grabbable : false};
        dataArr.push(newBracket);

    }

    //Determine the startKey for automatic text generation (use generatedText)
    const determineStartKey = (modelType, generatedText) => {

        let startKey;

        //Based on the model type, decide the final n words to check
        let n = 1;
        if (modelType === "Tri-gram") {n = 2;}
        else if (modelType === "Tetra-gram") {n = 3;}
        
        startKey = reFormatText(generatedText.trim(" ").split(" ").slice(-n).join(" ").trim(" "));

        if (n === 1 && startKey.trim(" ").split(" ").length >= 2) {
            startKey = startKey.trim(" ").split(" ")[0]
        }

        return startKey;

    }

    // ======================= RENDERING FUNCTIONS =======================

    //Render a standalone tri-or-tetra-gram key (where the key must be split and arranged vertically)
    const renderStandaloneTriTetra = (words, modelType, dataArr, maxYTolerance, nodeID, nodeX) => {

        //Set startYCoord to the negative of the tolerance
        let startYCoord = -maxYTolerance;

        //Determine required number of partitions
        let p = 0;
        if (modelType === "Tri-gram") {p = 2;}
        else {p = 3;}
        let style = ""

        //Iterate through each word and create a node
        for (let i = 0; i < words.length; i++){

            //Update y-coordinate
            startYCoord += (Math.abs(maxYTolerance) * 2 / (p + 1));
            
            //Create new node - make the style bold if it is the last word on the list
            if (i === words.length - 1) {style = "bold"}

            //Render node
            renderNode(dataArr, words[i] + nodeID + i, words[i], nodeX, startYCoord, style);

        }

    }

    const renderStartKey = (startKey, modelType, dataArr, maxWrap, startYTolerance) => {
        if (modelType === "Bi-gram") {
            renderNode(dataArr, startKey, startKey, 0, 0)
        
        } else {

            //Words array
            let words = startKey.split(" ");
            
            //Set maximum y coordinate tolerance
            let startYTolerance = 50;

            //Render vertical node chain
            renderStandaloneTriTetra(words, modelType, dataArr, startYTolerance, "_START_", 0);

            //Render bracket node
            renderBracket(dataArr, startKey + "_BRACKET", maxWrap/2, 0, 50, 25);

        }
    }

    //Function to determine the x position of a bracket given the words said bracket must encompass
    //This is dynamic based on the length of the longest word
    const determineBracketXPos = (words, midpoint) => {

        //Find length of longest word
        let longestLength = 0;
        for (let k = 0; k < words.length; k++) {if (words[k].length > longestLength) {longestLength = words[k].length}} 

        //Right bound of the bracket will be midpoint + 1/2 of the longest length times the number of pixels occupied by the characters.
        //Each character is ~8-10 pixels wide. Accounting for some whitespace room (to make the graph look more visually appealing), the multiplicative constant chosen is 8.5.
        return midpoint + (longestLength * 8.5);

    }


    //Function to find the BOTTOM or TOP of a given set of L2 successors
    const findEdge = (masterArr, graphArr, idx, bottomOrTop) => {

        let currentBottom = 0;

        if (masterArr[idx]["type"] === "box") {

            if (bottomOrTop === "bottom") {currentBottom = masterArr[idx]["centerLine"] + (masterArr[idx]["height"]/2)}
            else {currentBottom = masterArr[idx]["centerLine"] - (masterArr[idx]["height"]/2)}
            

        //If this is a single type, we always query the first node. If this is a split type, we query the first node for top and the final node for bottom.
        } else {

            let nodeIdx = 0;
            if (masterArr[idx]["type"] === "split" && bottomOrTop === "bottom") {nodeIdx = masterArr[idx]["elements"].length - 1;}
            //Get respective node and find y position
            let node = graphArr.filter((data_item, data_entry) => data_item["data"]["id"] === masterArr[idx]["elements"][nodeIdx])

            currentBottom = node[0]["position"]["y"]

        }

        return currentBottom;
    }

    //Return all values, variables, and functions
    return (
        <VisContext.Provider
            value = {{
                renderNode,
                renderBracket,
                determineStartKey,
                renderStandaloneTriTetra,
                determineBracketXPos,
                findEdge
            }}>
            {children}
        </VisContext.Provider>
    )

}
