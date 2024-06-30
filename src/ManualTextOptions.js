import React, { useEffect, useState } from "react";
import { useDictContext } from "./Context";
import { render } from "@testing-library/react";

export default function ManualTextOptions(props){
    //Get dictionary, model type, generated text, and word count
    const {nGramDict, generatedText, modelType, enableButton, reFormatText, unFormatText, wordOptions} = useDictContext();

    //Array to store individual words in pane 3 (for ease of dictionary querying)
    const [genSplitText, setGenSplitText] = useState(generatedText.split(" "));
    const [dictRendered, setDictRendered] = useState(false);

    //Generated text split into individual words
    useEffect(() => {
        setGenSplitText(generatedText.split(" "));
    }, [generatedText])

    useEffect(() => {

        setDictRendered(true);
    }, [nGramDict])


    //Render the wordOptions pane during manual text generation
    return (
        <div className = "manual-text-pane" class = "flex flex-col w-3/12 p-2 space-y-2 h-full rounded-md outline outline-red-100 bg-white overflow-y-auto text-center items-center">
            <div className = "options-header" class = "flex font-bold">Choose next word:</div>
            {!enableButton ? (
                dictRendered ? (
                    wordOptions.map((word, index) => (
                        <div key = {index}>
                            {word === "End of chain" ? (
                                <button key = {index} class = "flex w-full shadow-md text-center items-center justify-center rounded-3xl p-2 bg-zinc-50 font-bold text-red-500">{
                                    reFormatText(word) 
                                }</button>
                            ) : (
                                
                                <button key = {index} onClick = {props.word_chosen} class = "flex w-full shadow-md text-center items-center justify-center rounded-3xl p-2 bg-zinc-50 font-bold text-red-500">
                                    {/* {console.log("MODEL TYPE:", modelType)}
                                    {console.log("N GRAM DICTIONARY:", nGramDict)}
                                    {console.log("KEY USED (BIGRAM):", unFormatText(generatedText.split(" ")[generatedText.split(" ").length - 1]))}
                                    {console.log("KEY USED (TRIGRAM):", unFormatText(generatedText.split(" ")[generatedText.split(" ").length - 2] + " " + generatedText.split(" ")[generatedText.split(" ").length - 1]))} */}
                                    {reFormatText(word)} ({
                                    (modelType === "Bi-gram" && nGramDict.get(unFormatText(generatedText.split(" ")[generatedText.split(" ").length - 1])).get(unFormatText(word))) ||
                                    (modelType === "Tri-gram" && nGramDict.get(unFormatText(generatedText.split(" ")[generatedText.split(" ").length - 2] + " " + generatedText.split(" ")[generatedText.split(" ").length - 1])).get(unFormatText(word))) ||    
                                    (modelType === "Tetra-gram" && nGramDict.get(unFormatText(generatedText.split(" ")[generatedText.split(" ").length - 3] + " " + generatedText.split(" ")[generatedText.split(" ").length - 2] + " " + generatedText.split(" ")[generatedText.split(" ").length - 1])).get(unFormatText(word)))
                                    })
                                </button>
                            )}
                        </div>
                    ))
                ) : (
                    <div></div>
                )
            ) : (
                <div className = "rebuild-manual-text" class = "text-sm text-red-500 font-bold">Please re-build the dictionary to continue manually generating text.</div>
            )}

        </div>
    )
}