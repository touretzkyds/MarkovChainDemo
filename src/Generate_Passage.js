import React, {useState, useEffect} from "react";
import { useDictContext } from "./Context";
//For displaying options during manual text generation
import ManualTextOptions from "./Manual_Text_Options";

//Function
export default function GeneratePassage(props){
    //Get user ID and other helper variables from context
    //In particular, leverage nodesAdded rather than generatedText to display iteratively and higlight keys in automatic generation mode
    const {nGramDict, modelType, generatedText, setGeneratedText, wordCount, setCurrentWord, wordOptions, setWordCount, textGenMode, setTextGenMode, nodesAdded, setNodesAdded, generate_text} = useDictContext();
    //Enable next word selection panel
    const [enableNextWord, setEnableNextWord] = useState(false);
    //Keep track for the switch whether the mode of generation is automatic or not
    const [isAutomaticSwitch, setIsAutomaticSwitch] = useState(true);
    
    //Get mode of generation when changed
    const change_mode_generation = () => {
        //Toggle current mode of generation to the opposite
        setIsAutomaticSwitch(!isAutomaticSwitch);
    }

    //Track when switch toggle changes register, and begin the process of changing generation modes.
    useEffect(() => {
        //If the mode of generation is automatic, set enableNextWord to false, otherwise true
        if (isAutomaticSwitch) {
            //Set enable next word
            setEnableNextWord(false);
            //Set generation mode
            setTextGenMode("automatic");
        } else {
            //Enable next word generation (manual)
            setEnableNextWord(true);
            //Set generation mode to manual
            setTextGenMode("manual")
        }
        //Set generatedText to "" each time the mode has changed, as well as the nodes added array
        setGeneratedText("");
        setNodesAdded([]);
    }, [isAutomaticSwitch])

    //Get word limit when changed
    const change_word_limit = (new_limit) => {
        setWordCount(new_limit.target.value)
    }

    //Click handler
    const gen_button_clicked = () => {
        //Generate text
        setGeneratedText(generate_text(nGramDict, modelType, wordCount))
    }

    //When the Random Choice button is clicked in manual generation mode.
    const random_word_choice = () => {
        //Randomly choose a word from wordOptions
        const start_word = wordOptions[Math.floor(Math.random() * wordOptions.length)];
        //Set current word
        setCurrentWord(start_word);
    }

    return (
        <div className = "generated-passage-section" class = "flex flex-col space-y-2 h-full w-full align-left text-left items-center justify-center bg-zinc-50 rounded-md drop-shadow-md">
            <div className = "panel-2-header" class = "flex flex-row h-fit w-11/12 align-center items-center justify-center space-x-4">
                <div className = "passage-text-and-generation-method" class = "flex-auto flex-col align-left items-left w-4/12">
                    <div className = "generated-text" class = "flex font-bold monitor:text-lg 2xl:text-sm xl:text-sm sm:text-xs text-left w-full">[3] Generate From {modelType} Dictionary.</div>              
                    <div className = "generation-method-selection" class = "flex flex-row items-center justify-center w-fit space-x-2">
                        <div className = "automatic-label" class = "monitor:text-lg 2xl:text-base xl:text-sm sm:text-xs">Automatic</div>
                        <label for = "generation-mode-switch" class = "flex items-center bg-neutral-200 cursor-pointer relative monitor:w-15 2xl:w-10 xl:w-8 sm:w-8 monitor:h-5 2xl:h-5 xl:h-4 sm:h-4 rounded-full">
                            <input type = "checkbox" id = "generation-mode-switch" class = "flex sr-only peer" onChange = {change_mode_generation} checked = {textGenMode !== "automatic"}></input>
                            <span class = "flex w-2/5 h-4/5 bg-sky-900 absolute rounded-full peer-checked:bg-red-500 peer-checked:right-0 transition-all duration-500"></span>
                        </label>
                        <div className = "manual-label" class = "monitor:text-lg 2xl:text-base xl:text-sm sm:text-xs">Manual</div>
                        {/* <div className = "auto-select" class = "flex flex-row space-x-2 w-fit">
                            <input type = "radio" id = "automatic" name = "generation-type" value = "automatic" onChange = {change_mode_generation} checked = {textGenMode === "automatic"} class = "flex" ></input>
                            <label for = "automatic" class = "monitor:text-lg 2xl:text-base xl:text-sm sm:text-xs">Automatic</label>
                        </div>
                        <div className = "manual-select" class = "flex flex-row space-x-2 w-fit">
                            <input type = "radio" id = "manual" name = "generation-type" value = "manual" onChange = {change_mode_generation} checked = {textGenMode === "manual"} class = "flex"></input>
                            <label for = "manual" class = "monitor:text-lg 2xl:text-base xl:text-sm sm:text-xs">Manual</label>
                        </div> */}
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
                            <button className = "generate-text" onClick = {gen_button_clicked} class = "flex self-center text-center align-middle text-center justify-center items-center monitor:text-base 2xl:text-sm xl:text-sm sm:text-xs justify-end bg-sky-900 text-white font-bold rounded-md w-6/12 py-2 h-10 outline outline-1 hover:bg-slate-700 hover:ring">Generate Text</button>
                        </div>
                    ) : (
                        <button className = "random-word-choice" onClick = {random_word_choice} class = "flex self-center text-center align-middle text-center justify-center items-center monitor:text-base 2xl:text-sm xl:text-sm sm:text-xs justify-end bg-red-500 text-gray-300 text-white font-bold rounded-md w-6/12 py-2 h-10 outline outline-1 hover:bg-red-800 hover:ring">Random Choice</button>
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
                            <div className = "text-container" class = "flex flex-wrap h-fit w-fit">
                            {generatedText.split(" ").map((word, index) => (
                                //Display word and add a space if not at the final word
                                //If encountering a bi-gram model, highlight the final word. If working with a tri-gram model, highlight the last two words. If working with a tetra-gram model, highlight the last three words.
                                <div key = {index} class = "inline">
                                    {modelType === "Bi-gram" ? index >= generatedText.split(" ").length - 1 ? 
                                    <li class = "inline list-none text-red-500">{word.replace(".", "<PERIOD>").replace("!", "<EXCL>").replace("?", "<Q>").trim()}</li> : 
                                    <li class = "inline list-none">{word.replace(".", "<PERIOD>").replace("!", "<EXCL>").replace("?", "<Q>").trim()}</li> : null}
                                {modelType === "Tri-gram" ? index >= generatedText.split(" ").length - 2? 
                                    <span class = "text-red-500">{word.replace(".", "<PERIOD>").replace("!", "<EXCL>").replace("?", "<Q>").trim()}</span> : 
                                    <span>{word.replace(".", "<PERIOD>").replace("!", "<EXCL>").replace("?", "<Q>").trim()}</span> : null}
                                {modelType === "Tetra-gram" ? index >= generatedText.split(" ").length - 3? 
                                    <span class = "text-red-500">{word.replace(".", "<PERIOD>").replace("!", "<EXCL>").replace("?", "<Q>").trim()}</span> : 
                                    <span>{word.replace(".", "<PERIOD>").replace("!", "<EXCL>").replace("?", "<Q>").trim()}</span> : null}
                                {/* {index >= nodesAdded.length - 1 && <span>{word}</span>}*/}
                                {index !== (generatedText.split(" ").length - 1) ? <span>&nbsp;</span> : null}
                                </div>
                            ))}
                            </div>
                        </div>
                        <ManualTextOptions enableNextWord = {enableNextWord}/>
                    </div>
                    
                )}
            </div>
            
        </div>
    )
}