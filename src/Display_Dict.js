import React, {useState, useEffect} from "react";
import { useDictContext } from "./Context";

//For infinite text generation, if needed. This feature is currently disabled; some pieces of code are commented out as a result.
//If you'd like to enable this, simply uncomment the marked pieces of code (such as the following imports)
// import {useState} from "react";
// import InfiniteScroll from "react-infinite-scroller";
// import {FixedSizeList as List} from "react-window";
// import AutoSizer from "react-virtualized-auto-sizer";

function DisplayDict() {
    //Get variables from context
    const { nGramDict, modelType, setModelType, branchingFactor, 
            setBranchingFactor, pane2KeyClicked, setPane2KeyClicked, globalStartKey, setGlobalStartKey,
            manualStartKey, setManualStartKey, unFormatText, currentWord, setCurrentWord, setCurrentWordCounter, textGenMode,
            lenDict, setLenDict, reFormatText, branching_factor, setGeneratedText, generate_text, wordCount, wordOptions} = useDictContext();


    //INFINITE SCROLLING VARIABLES AND FUNCTIONS

    // const nDictItems = 40;
    // const [hasDictElements, setHasDictElements] = useState(true);
    // const [currentDictDisplayed, setCurrentDictDisplayed] = useState(nDictItems);
    // const [loadDictElements, setLoadDictelements] = useState(false);

    // //To load additional dictionary elements if present when scroll is complete
    // const loadDictElements = () => {

    //     //If the current elements being displayed are identical to the dictionary's length, stop
    //     if (nGramDict.size === currentDictDisplayed) {
    //         setHasDictElements(false);
    //     //After a brief delay, load more elements
    //     } else {
    //         setTimeout(() => {
    //             setCurrentDictDisplayed(currentDictDisplayed + nDictItems);
    //         }, 1)
    //     }
    // }

    // //Implementation allowing for aforementioned additional dict elements to be displayed
    // const displayDictElements = (element) => {

    //     let allElements = [];
    //     //Convert map to array
    //     let arr = Array.from(nGramDict);
    //     //Iterate
    //     if (arr.length !== 0) {
    //         for (let i = 0; i < Math.min(nGramDict.size, currentDictDisplayed); i++) {
    //             allElements.push(
    //                 <div key = {i} class = "">
    //                     <strong class = "text-green-900">{reFormatText(arr[i][0])}: </strong>
    //                     {Array.from(arr[i][1]).map(([item, count], index, successorArr) => (
    //                         <React.Fragment key={`${arr[i][0]}-${item}`}>
    //                             <li className="inline list-none">
    //                                 {reFormatText(item)} (<span>{count}</span>)
    //                             </li>
    //                             {index < successorArr.length - 1 && <span>, </span>}
    //                         </React.Fragment>
    //                     ))}
    //                 </div>
    //             )
    //         }
    //     }
    //     return allElements;

    // }

    //When a model option is selected
    const modelSelect = (selection) => {
        //Check if the button is disabled.
        //If so, a change should trigger the generation of a novel dictionary and text generation.
        //Otherwise, simply update the state.
        setModelType(selection.target.value)
    }

    //When a dictionary key is clicked, update the third and fourth panes
    const dictKeyClicked = (event) => {

        if (!pane2KeyClicked) {

            //Set key
            setGlobalStartKey(unFormatText(event.target.innerText).replace(/:+$/, ""));
            //Set clicked status to true
            setPane2KeyClicked(true);
            setManualStartKey(true);

            if (textGenMode === "automatic") {
                setGeneratedText(generate_text(event.target.innerText.replace(":", "").trim(), nGramDict, modelType, wordCount))
            } else {

                //Set the current word counter (tracking the position of the current word) to zero as well
                setCurrentWordCounter(0);
                
                setGeneratedText("");
                //For enabling manual text generation with this new word
                setCurrentWord(event.target.innerText.replace(":", "").trim())

            }


        }
        
    }

    //Calculate branching factor, length, and word frequencies of the dictionary (if the model is a bi-gram) each time the dict changes
    useEffect(() => {

        setBranchingFactor(branching_factor(nGramDict));
        setLenDict(nGramDict.size);
        //determine_frequency()

        //The following line suppresses warnings regarding not including some variables in the useEffect dependency array.
        //This is INTENTIONAL - said variables are NOT supposed to influence the given useEffect hook. 
        //eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nGramDict])

    //Function to convert any map to an object
    const convertMapToObject = (map) => {

        //To save nGramDict, which is a map of maps, we must first convert it to an object
        const mapObj = {};

        //Iterate through map
        for (let [key, value] of map) {
            //If the object is a map (which it will be because it is a map of maps), employ recursion
            if (value instanceof Map) {
                mapObj[key] = convertMapToObject(value);
            } else {mapObj[key] = value;}
        }

        return mapObj;
    }

    //Save function
    const save_dictionary = () => {
        
        //Convert to object
        const nGramObj = convertMapToObject(nGramDict);

        //Convert to JSON
        const json_obj = JSON.stringify([nGramObj, null, 2]);
        //Blob
        const blob = new Blob([json_obj], {type : "application/json"});
        //Download URL
        const download_url = URL.createObjectURL(blob);

        //Create new reference for download
        const a = document.createElement("a");
        a.href = download_url;
        a.download = "Model_Dictionary.json";
        a.click();
        
        //Clean URL
        URL.revokeObjectURL(download_url);
    }

    return (
        <div className = "dict-stat-display" class = "flex flex-col w-full h-full items-center align-center text-center justify-center rounded-md bg-zinc-50 drop-shadow-md space-y-2">
            <div className = "panel-2-header" class = "flex flex-row h-fit w-11/12 align-center items-center justify-center space-x-4">
                <div className = "gen-dict-label" class = "flex text-left justify-start monitor:text-lg 2xl:text-sm xl:text-sm sm:text-xs text-lg font-bold space-x-5">[2] 
                    <div className = "n-gram-selection" class = "flex-auto flex-col w-1/6 align-center text-center items-center justify-center space-y-1 space-x-2 ">
                        <div class = "group relative w-full h-full pr-2 pl-2 ">
                            <select name = "n-gram-model-type" id = "n-gram-model-type" defaultValue = {modelType} onChange = {modelSelect} class = "flex w-12/12 self-center mx-auto block align-center items-center justify-center monitor:text-lg 2xl:text-md xl:text-sm sm:text-xs rounded-md outline outline-slate-200 outline-3 focus:outline-none focus:ring text-center hover:bg-zinc-200">
                                <option key = "Bi-gram">Bi-gram</option>
                                <option key = "Tri-gram">Tri-gram</option>
                                <option key = "Tetra-gram">Tetra-gram</option>
                            </select>
                            <div class = "hidden group-hover:block absolute p-1 rounded-md text-xs top-full bg-green-900 text-white">
                                Click to select a model type.
                            </div>
                        </div>

                        {/* <div class = "flex fixed text-center text-xs">(Select model type)</div> */}
                    </div>
                    Dictionary.
                </div>
                <div className = "stat-display" class = "flex flex-grow align-center items-center w-5/12 h-4/6 bg-white outline outline-2 outline-green-900 rounded-md">
                    <div className = "stat_display" class = "flex-auto monitor:text-sm 2xl:text-xs xl:text-xs sm:text-xs text-green-900 overflow-x-auto overflow-y-auto overflow-x"><strong>Number of Entries: </strong>{lenDict}, <strong>Branching Factor: </strong>{branchingFactor} </div>
                </div>
                <button className = "build-ngram-dict" onClick = {save_dictionary} class = "flex-auto monitor:text-base 2xl:text-sm xl:text-sm sm:text-xs bg-black text-white font-bold rounded-md w-1 h-10 outline outline-1 hover:bg-slate-700 hover:ring">Export</button>
            </div>
            
            <div className = "dict-display" class = "w-11/12 h-5/6 outline outline-slate-200 bg-white rounded-md overflow-y-auto text-left p-2 inline">
                {/* If wanting to enable infinite scrolling, uncomment the following lines, and comment the {Array.from...} section. */}
                
                {/* <InfiniteScroll
                    pageStart = {0}
                    loadMore = {loadDictElements}
                    hasMore = {hasDictElements}
                    loader = {<div className = "loading">{nGramDict.size !== 0 && nGramDict.size > currentDictDisplayed && <p>Loading...</p>}</div>}
                    useWindow = {false}
                >
                    {displayDictElements(nGramDict)}
                </InfiniteScroll> */}
                
                    {Array.from(nGramDict).map(([key, values], index) => {


                        return (
                        <div key = {index} class = "">
                            <strong class = "text-green-900 hover:bg-green-200 rounded-md cursor-pointer" onClick = {dictKeyClicked}>{reFormatText(key)}: </strong>
                            {Array.from(values).map(([item, count], index, successorArr) => (
                                <React.Fragment key={`${values}-${item}`}>
                                    <li className="inline list-none">
                                        {reFormatText(item)} (<span>{count.toFixed(2)}</span>)
                                    </li>
                                    {index < successorArr.length - 1 && <span>, </span>}
                                </React.Fragment>
                            ))}
                        </div>
                        )
                    })}

            </div>
        </div>
    )
}

export default DisplayDict;