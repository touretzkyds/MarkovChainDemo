import React, { useEffect, useState, useRef } from "react";
import { useDictContext } from "./Context";

export default function ManualTextOptions(props){
    //Get dictionary, model type, generated text, and word count
    const {nGramDict, generatedText, panesCleared,
        modelType, enableButton, wordOptions} = useDictContext();

    //Array to store individual words from generated text in pane 3
    let genSplitText = generatedText.split(" ");

    //Render the wordOptions pane during manual text generation
    return (
        <div className = "manual-text-pane" class = "flex flex-col w-3/12 p-2 space-y-2 h-full rounded-md outline outline-red-100 bg-white overflow-y-auto text-center items-center">
            <div className = "options-header" class = "flex font-bold">Choose next word:</div>
            {!enableButton ? (
                wordOptions.map((word, index) => (
                    <div key = {index}>
                        {word === "End of chain" ? (

                            <button key = {index} class = "flex w-full shadow-md text-center items-center justify-center rounded-3xl p-2 bg-zinc-50 font-bold text-red-500">{
                                word
                            }</button>

                        ) : (
                            
                            <button key = {index} onClick = {props.word_chosen} class = "flex w-full shadow-md text-center items-center justify-center rounded-3xl p-2 bg-zinc-50 font-bold text-red-500">
                                {word} ({
                                (modelType === "Bi-gram" && !panesCleared && nGramDict.size !== 0 && genSplitText[0] !== "" && nGramDict.keys().next().value.split(" ").length === 1 && nGramDict.get(genSplitText[genSplitText.length - 1]).get(word).toFixed(2)) ||
                                (modelType === "Tri-gram" && !panesCleared && nGramDict.size !== 0 && genSplitText[0] !== "" && nGramDict.keys().next().value.split(" ").length === 2 && nGramDict.get(genSplitText[genSplitText.length - 2] + " " + genSplitText[genSplitText.length - 1]).get(word).toFixed(2)) ||    
                                (modelType === "Tetra-gram" && !panesCleared && nGramDict.size !== 0 && genSplitText[0] !== "" && nGramDict.keys().next().value.split(" ").length === 3 && nGramDict.get(genSplitText[genSplitText.length - 3] + " " + genSplitText[genSplitText.length - 2] + " " + genSplitText[genSplitText.length - 1]).get(word).toFixed(2))
                                })
                            </button>

                        )}
                    </div>
                ))
            ) : (
                <div className = "rebuild-manual-text" class = "text-sm text-red-500 font-bold">Please re-build the dictionary to continue manually generating text.</div>
            )}

        </div>
    )
}