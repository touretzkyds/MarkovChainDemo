import React from "react";
import { useDictContext } from "./Context";

export default function ManualTextOptions(props){
    //Get dictionary, model type, generated text, and word count
    const {nGramDict, generatedText, enableButton, reFormatText, wordOptions} = useDictContext();

    //Generated text split into individual words
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
                                reFormatText(word) 
                            }</button>
                        ) : (
                            <button key = {index} onClick = {props.word_chosen} class = "flex w-full shadow-md text-center items-center justify-center rounded-3xl p-2 bg-zinc-50 font-bold text-red-500">
                                {reFormatText(word)} ({nGramDict.get(genSplitText[genSplitText.length - 1]).get(word)})
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