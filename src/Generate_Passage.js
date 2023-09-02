import React, {useState, useEffect} from "react";
import { useDictContext } from "./Context";
//For displaying options during manual text generation
import ManualTextOptions from "./Manual_Text_Options";

//Function
export default function GeneratePassage(props){
    //Get user ID and generateText function from context
    const {nGramDict, modelType, generatedText, setGeneratedText, wordCount, setWordCount, textGenMode, setTextGenMode, generate_text} = useDictContext();
    //Enable next word selection panel
    const [enableNextWord, setEnableNextWord] = useState(false);
    
    //Get mode of generation when changed
    const change_mode_generation = (new_mode) => {
        setTextGenMode(new_mode.target.value)
        //If the mode of generation is manual, set enableNextWord to true, otherwise false
        if (new_mode.target.value === "manual") {setEnableNextWord(true);}
        else if (new_mode.target.value === "automatic") {setEnableNextWord(false);}
        //Set generatedText to "" each time the mode has changed
        setGeneratedText("")
    }

    //Get word limit when changed
    const change_word_limit = (new_limit) => {
        setWordCount(new_limit.target.value)
    }

    //Click handler
    const gen_button_clicked = () => {
        //Generate text
        setGeneratedText(generate_text(nGramDict, modelType, wordCount))
    }

    return (
        <div className = "generated-passage-section" class = "flex flex-col space-y-2 h-full w-full align-left text-left items-center justify-center bg-zinc-50 rounded-md drop-shadow-md">
            <div className = "panel-2-header" class = "flex flex-row h-fit w-11/12 align-center items-center justify-center space-x-4">
                <div className = "passage-text-and-generation-method" class = "flex-auto flex-col align-left items-left w-4/12">
                    <div className = "generated-text" class = "flex font-bold monitor:text-lg 2xl:text-sm xl:text-sm sm:text-xs text-left w-full">[3] Generate From {modelType} Dictionary.</div>              
                    <div className = "generation-method-selection" class = "flex flex-row w-fit space-x-2">
                        <div className = "auto-select" class = "flex flex-row space-x-2 w-fit">
                            <input type = "radio" id = "automatic" name = "generation-type" value = "automatic" onChange = {change_mode_generation} checked = {textGenMode === "automatic"} class = "flex" ></input>
                            <label for = "automatic" class = "monitor:text-lg 2xl:text-base xl:text-sm sm:text-xs">Automatic</label>
                        </div>
                        <div className = "manual-select" class = "flex flex-row space-x-2 w-fit">
                            <input type = "radio" id = "manual" name = "generation-type" value = "manual" onChange = {change_mode_generation} checked = {textGenMode === "manual"} class = "flex"></input>
                            <label for = "manual" class = "monitor:text-lg 2xl:text-base xl:text-sm sm:text-xs">Manual</label>
                        </div>
                    </div>
                </div>
                {textGenMode === "automatic" ? (
                    <div class = "w-0"></div>
                ): (
                    <div className = "automatic-instructions" class = "flex flex-auto w-4/12 text-xs h-full justify-center items-center">
                        Choose a word to extend the passage.
                    </div>
                )}
                <div className = "button-and-word-limit-container" class = "flex w-1/3 h-full align-middle justify-end items-right space-x-2">
                    {textGenMode === "automatic" ? (
                        <div class = "flex h-full w-full items-right align-right justify-end">
                            <div className = "word-limit" class = "flex flex-col w-5/12 justify-center text-center items-center space-y-1">
                                <label for = "word-limit" class = "monitor:text-base 2xl:text-sm xl:text-sm sm:text-xs">Max Words:</label>  
                                <input type = "text" id = "word-limit" name = "word-limit" placeholder = "100" value = {wordCount} onChange = {change_word_limit} class = "flex h-1/2 w-9/12 rounded-md outline outline-slate-100 justify-center items-center text-center monitor:text-base 2xl:text-sm xl:text-sm sm:text-xs"></input>
                            </div>
                            <button className = "build-ngram-dict" onClick = {gen_button_clicked} class = "flex self-center text-center align-middle text-center justify-center items-center monitor:text-base 2xl:text-sm xl:text-sm sm:text-xs justify-end bg-sky-900 text-white font-bold rounded-md w-6/12 py-2 h-10 outline outline-1 hover:bg-slate-700 hover:ring">Generate Text</button>
                        </div>
                    ) : (
                        <button className = "build-ngram-dict" class = "flex self-center text-center align-middle text-center justify-center items-center monitor:text-base 2xl:text-sm xl:text-sm sm:text-xs justify-end bg-gray-200 text-gray-300 text-white font-bold rounded-md w-6/12 py-2 h-10 outline outline-1">Generate Text</button>
                    )}
                </div>
            </div>
            <div className = "text-generation-window" class = "flex flex-row w-11/12 h-5/6 space-x-2">
                {textGenMode === "automatic" ? (
                    <div className = "automatic-text-container" class = "flex w-full h-full">
                        <div className = "generated-text" class = "w-full h-full bg-white outline outline-sky-100 rounded-md overflow-y-auto p-2 text-left">{generatedText}</div>
                        <div class = "w-0"></div>
                    </div>
                ): (
                    <div className = "manual-text-container" class = "flex flex-row w-full h-full space-x-2">
                        <div className = "generated-text" class = "flex w-9/12 h-full bg-white outline outline-sky-100 rounded-md overflow-y-auto p-2 text-left">
                            {generatedText}
                            {/* {generatedText.split(" ").map((word, index) => (
                                index > 1 && 
                                <li key = {index} class = "inline list-none ${index >= generatedText.length -1 ? 'text-red-600 font-bold' : ''}">{word}</li>
                            ))} */}
                        </div>
                        <ManualTextOptions enableNextWord = {enableNextWord}/>
                    </div>
                    
                )}
            </div>
            
        </div>
    )
}