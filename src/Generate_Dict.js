import React, {useState, useEffect} from "react";
import ReactDOM from 'react-dom';
import axios from "axios";
import { useDictContext } from "./Context";

function removeHtmlTags(htmlString) {
    var doc = new DOMParser().parseFromString(htmlString, 'text/html');
    return doc.body.textContent || "";
}

export default function GenerateDict(props){
    //Get dictionary, branching factor, and number of bigrams from context manager
    const {inputText, setInputText, nGramDict, setNGramDict, modelType, setModelType, setGeneratedText, wordCount, textGenMode, build_dictionary, generate_text} = useDictContext();
    
    //Enabling the Re-build button
    let [enableButton, setEnableButton] = useState(false);
    //Text provided state
    let [validText, setValidText] = useState(true);
    //Dictionary generated state
    let {dictGenerated, setDictGenerated} = props;

    //Wikipedia Article Title
    const [wikiArticleTitle, setWikiArticleTitle] = useState("");

    //When text is entered into the textarea
    const textRetrieval = (text) => {
        //Set input text
        setInputText(text.target.value)
        //Check if we are not currently performing manual text generation
        if (textGenMode != "manual") {
            //Enable the Re-Build Dictionary Button
            setEnableButton(true);
        }
    }

    //When the title of the input Wikipedia article has been changed
    const wikiTitleChange = (title) => {
        //Set title
        setWikiArticleTitle(title.target.value);

    }

    useEffect(() => {
        console.log("INPUT TEXT:", inputText);
    }, [inputText])

    //When an article is attempting to be imported from Wikipedia
    const importWikiArticle = async () => {

        //Replace all spaces in text with underscores
        const formattedTitle = wikiArticleTitle.replace(" ", "_")
        //Attempt an API request (get the associated Wikipedia article)
        try {
            //Request
            const wikiResponse = await axios.get(
                "https://en.wikipedia.org/w/api.php?action=query&origin=*&prop=extracts&format=json&exintro=&titles=" + formattedTitle
            )
            console.log("WIKI RESPONSE:", wikiResponse);
            
            //Get all pages, find the first page index, and extract all text
            const allPages = wikiResponse.data.query.pages;
            const firstPage = Object.keys(allPages)[0];

            //Check to see if the extraction was successful
            if (firstPage === "-1") {
                setInputText("An incorrect article name was given. Please verify that the article exists, and try again.")
                setWikiArticleTitle("")
            } else {
                console.log("FIRST PAGE INDEX", firstPage);
                const extractedFPText = allPages[firstPage].extract;
                const cleanedText = removeHtmlTags(extractedFPText).replace("\n", "").trim().split("\n").join("\n\n");
                console.log("EXTRACTED TEXT:", cleanedText);
                //Replace all HTML tages in extracted text with content
    
                setInputText(cleanedText);
    
                //Check if we are not currently performing manual text generation
                if (textGenMode != "manual") {
                    //Enable the Re-Build Dictionary Button
                    setEnableButton(true);
                }
            }


        } catch (error) {
            console.log("An error has been encountered.")
        }
    }
    
    //When the re-build dictionary button is clicked
    const rebuild_dict_clicked = () => {
        //Verify that adequate text has been provided
        if (inputText.split(/\s+/).filter(word => word !== "").length < 2) {
            setValidText(false);
        }
        else {setValidText(true);}
        if (validText) {
            //Update nGram dictionary
            setNGramDict(build_dictionary(inputText, modelType));
            //Set enable button to false
            setEnableButton(false);
        }

    }

    //Use Effect -> builds dictionary and generates text each time the model type is changed and the enable button is disabled.
    useEffect (() => {
        //Check if the button is not enabled and that manual text generation is not currently being done
        if (!enableButton) {
            //Trigger dictionary generation
            setNGramDict(build_dictionary(inputText, modelType));
        }
    }, [modelType])

    //Generate Text when the dictionary is altered. 
    useEffect(() => {
        //Check to verify that manual text generation has not taken place
        if (textGenMode != "manual") {
            setGeneratedText(generate_text(nGramDict, modelType, wordCount));
        }
    }, [nGramDict, modelType, wordCount])

    //HTML
    return (
        <div className = "text-processing" class = "flex flex-col space-y-2 h-full w-full items-center justify-center rounded-md bg-zinc-50 drop-shadow-md" >
            <div className = "panel-1-header" class = "flex flex-row h-fit w-11/12 align-center items-center justify-center space-x-2">
                <div className = "header-and-import" class = "flex-auto flex-col w-4/12 space-y-2">
                    <div className = "text-entrance-text" class = "flex h-2/3  monitor:text-lg 2xl:text-sm xl:text-sm sm:text-xs font-bold">[1] Provide a Passage; Choose a Model.</div>
                    <textarea className = "wiki-search-area" onChange = {wikiTitleChange} class = "h-5 w-10/12 text-xs overflow-x-auto overflow-hidden text-center items-center overflow-none w-full  rounded-lg outline outline-slate-200 focus:outline-none focus:ring focus:border-slate-500" defaultValue = "🔍Search for a Wikipedia Article."></textarea>
                </div>
                <button className = "import-from-wiki" onClick = {importWikiArticle} class = " flex-auto w-2/12 h-4/6 rounded-md font-bold bg-green-900 text-white monitor:text-sm 2xl:text-sm xl:text-xs sm:text-xs hover:bg-slate-700 hover:ring">Import from Wikipeda</button>            
                { enableButton ? (
                    <button className = "build-ngram-dict" onClick = {rebuild_dict_clicked} class = "flex-auto monitor:text-base 2xl:text-sm xl:text-sm sm:text-xs bg-black text-white font-bold rounded-md w-2/12 h-4/6 outline outline-1 hover:bg-slate-700 hover:ring">Re-Build Dictionary</button>
                ) : (
                    <button className = "build-ngram-dict" class = "flex-auto monitor:text-base 2xl:text-sm xl:text-sm sm:text-xs bg-gray-200 text-gray-300 font-bold rounded-md monitor:w-2/12 2xl:w-3/12 h-4/6 outline outline-1">Re-Build Dictionary</button>
                )}
            </div>
            
            <textarea className = "gram-model-text" type = "textarea" defaultValue = {inputText} onChange = {textRetrieval} value = {inputText} class = "rounded-md p-2 h-5/6 w-11/12 outline outline-slate-200 focus:outline-none focus:ring focus:border-slate-500"></textarea>
            {/* Display the text generation option if clicked is true*/}
            {validText ? (
                <div></div>
            ) : (
                <div className = "no-text-provided" class = "text-red-500 text-sm font-bold">Please provide a sample input passage with at least 2 words.</div>
            )}
        </div>
    )
}