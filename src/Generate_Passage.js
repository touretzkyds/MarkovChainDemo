import React from "react";
import { useDictContext } from "./Context";

//Function
export default function GeneratePassage(props){
    //Get user ID and generateText function from context
    const {nGramDict, modelType, generatedText, setGeneratedText, wordCount, generate_text} = useDictContext();

    //Click handler
    const gen_button_clicked = () => {
        //Generate text
        setGeneratedText(generate_text(nGramDict, modelType, wordCount))
    }
    return (
        <div className = "generated-passage-section" class = "flex flex-col space-y-2 h-full w-full align-left text-left items-center justify-center bg-zinc-50 rounded-md drop-shadow-md">
            <div className = "panel-2-header" class = "flex flex-row h-fit w-11/12 align-center items-center justify-center space-x-4">
                <div className = "generated-text" class = "font-bold monitor:text-lg 2xl:text-sm xl:text-sm sm:text-xs text-left w-1/2">[3] Generate Sample Passage.</div>
                <div className = "button-container" class = "flex w-1/2 h-full align-right justify-end items-right">
                    <button className = "build-ngram-dict" onClick = {gen_button_clicked} class = "text-center monitor:text-base 2xl:text-sm xl:text-sm sm:text-xs justify-end bg-sky-900 text-white font-bold rounded-md w-6/12 py-2 h-10 outline outline-1 hover:bg-slate-700 hover:ring">Generate Text</button>
                </div>
            </div>
            
            <div className = "generated-text" class = "w-11/12 h-5/6 bg-white outline outline-sky-100 rounded-md overflow-y-auto p-2 text-left">{generatedText}</div>
        </div>
    )
}