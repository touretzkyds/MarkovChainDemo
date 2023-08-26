import React, {useState, useEffect}from "react";
import { useDictContext } from "./Context";

function DisplayDict() {
    //Get variables from context
    const { nGramDict, branchingFactor, setBranchingFactor, lenDict, setLenDict, branching_factor} = useDictContext();

    //Calculate branching factor and length of dictionary each time the dict changes
    useEffect(() => {
        setBranchingFactor(branching_factor(nGramDict));
        setLenDict(Object.keys(nGramDict).length);
    }, [nGramDict])

    //Save function
    const save_dictionary = () => {
        //Conver to JSON
        const json_obj = JSON.stringify(nGramDict);
        console.log("JSON OBJECT", json_obj)
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
                <div className = "gen-dict-label" class = "flex-auto text-left justify-start monitor:text-lg 2xl:text-sm xl:text-sm sm:text-xs w-3/12 text-lg font-bold">[2] View Dictionary and Metrics.</div>
                <div className = "stat-display" class = "flex flex-grow align-center items-center w-5/12 h-4/6 bg-white outline outline-2 outline-green-900 rounded-md">
                    <div className = "stat_display" class = "flex-auto monitor:text-base 2xl:text-sm xl:text-xs sm:text-xs text-green-900 overflow-x-auto overflow-y-auto overflow-x"><strong>Number of Entries: </strong>{lenDict}, <strong>Branching Factor: </strong>{branchingFactor} </div>
                </div>
                <button className = "build-ngram-dict" onClick = {save_dictionary} class = "flex-auto monitor:text-base 2xl:text-sm xl:text-sm sm:text-xs bg-black text-white font-bold rounded-md w-1 h-10 outline outline-1 hover:bg-slate-700 hover:ring">Save</button>
            </div>
            
            <div className = "dict-display" class = "w-11/12 h-5/6 outline outline-slate-200 bg-white rounded-md overflow-y-auto text-left p-2 inline">
                {Object.entries(nGramDict).map(([key, value]) => (
                    <div key = {key} class = "">
                        <strong class = "text-green-900">{key.replace(".", "<period>").replace("!", "<exclaim>").replace("?", "<question>").trim()}: </strong>
                        {/* {key.includes(".") && <strong class = "text-green-900">&lt;period&gt; {key.replace(".", "").trim()}: </strong>}
                        {key.includes("!") && <strong class = "text-green-900">&lt;exclaim&gt; {key.replace("!", "").trim()}: </strong>}
                        {key.includes("?") && <strong class = "text-green-900">&lt;quotation&gt; {key.replace("?", "").trim()}: </strong>}
                        {!key.includes(".") && !key.includes("!") && !key.includes("?") && <strong class = "text-green-900">{key}: </strong>} */}
                        {value.map((item, index) => (
                            <React.Fragment key = {index}>
                                <li key = {index} class = "inline list-none">{item}</li>
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