import React, {useState, useEffect}from "react";
import { useDictContext } from "./Context";

function DisplayDict() {
    //Get variables from context
    const { inputText, setInputText, nGramDict, modelType, setModelType, 
            frequencies, setFrequencies, branchingFactor, setBranchingFactor, 
            lenDict, setLenDict, branching_factor, get_words} = useDictContext();

    //When a model option is selected
    const modelSelect = (selection) => {
        //Check if the button is disabled.
        //If so, a change should trigger the generation of a novel dictionary and text generation.
        //Otherwise, simply update the state.
        setModelType(selection.target.value)
    }

    //Calculate branching factor, length, and word frequencies of the dictionary (if the model is a bi-gram) each time the dict changes
    useEffect(() => {

        setBranchingFactor(branching_factor(nGramDict));
        setLenDict(Object.keys(nGramDict).length);
        determine_frequency()

    }, [nGramDict])

    //For each key in the dictionary, determine its frequency and store accordingly
    const determine_frequency = () => {
        //Create a dictionary to store frequencies
        const store_frequencies = {};
        //Iterate over all the inputText values - for each, count the number of times it occurs in the values of the dictionary
        for (const valuesList of Object.values(nGramDict)) {
            //Get filtered words
            const filtered_words = get_words(inputText);
            valuesList.forEach((key) => {
                //Set a counter
                let num_entries = 0;
                //Set a RegEx to match the key (more efficient for larger dictionaries)
                //Add backslash to key in case it is a special character
                let regex_key = key;
                if (key.includes("?") || key.includes("!") || key.includes(".")) {
                    regex_key = "\\" + key
                }                
                //Check the number of matches in the inputText string
                filtered_words.forEach(value => {
                    if (value === key) {num_entries++;}
                })
                //Store the final count in the frequencies dictionary
                store_frequencies[key] = num_entries;
            })
        }
        //Set frequencies hook
        setFrequencies(store_frequencies);
    }

    useEffect(() => {
        determine_frequency();
    }, [nGramDict])

    //Save function
    const save_dictionary = () => {
        //Conver to JSON
        const json_obj = JSON.stringify(nGramDict);
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
                <button className = "build-ngram-dict" onClick = {save_dictionary} class = "flex-auto monitor:text-base 2xl:text-sm xl:text-sm sm:text-xs bg-black text-white font-bold rounded-md w-1 h-10 outline outline-1 hover:bg-slate-700 hover:ring">Save</button>
            </div>
            
            <div className = "dict-display" class = "w-11/12 h-5/6 outline outline-slate-200 bg-white rounded-md overflow-y-auto text-left p-2 inline">
                {Object.entries(nGramDict).map(([key, value]) => (
                    <div key = {key} class = "">
                        <strong class = "text-green-900">{key.replace(".", "<PERIOD>").replace("!", "<EXCL>").replace("?", "<Q>").trim()}: </strong>
                        {value.map((item, index) => (
                            <React.Fragment key = {index}>
                                <li key = {index} class = "inline list-none">{item.replace(".", "<PERIOD>").replace("!", "<EXCL>").replace("?", "<Q>").trim()}{<span> ({frequencies[item]})</span>}</li>
                                {index < value.length - 1 && <span>, </span>}
                            </React.Fragment>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    )
}

export default DisplayDict