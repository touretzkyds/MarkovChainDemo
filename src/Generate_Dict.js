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

    //To verify if a Wikipedia article has been imported
    const [wikiImported, setWikiImported] = useState(false);

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
            
            //Get all pages, find the first page index, and extract all text
            const allPages = wikiResponse.data.query.pages;
            const firstPage = Object.keys(allPages)[0];

            //Check to see if the extraction was successful
            if (firstPage === "-1") {
                setInputText("Could not find article named '" + formattedTitle + "'. Please check spelling and capitalization.");
                setWikiArticleTitle("")
            } else {
                const extractedFPText = allPages[firstPage].extract;
                const cleanedText = removeHtmlTags(extractedFPText).replace("\n", "").trim().split("\n").join("\n\n");
                //Replace all HTML tages in extracted text with content
                setInputText(cleanedText);

                //Set the Wikipedia Imported flag to true (which will trigger automatic dictionary and text generation updates)
                setWikiImported(true);
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

    //Handle when the clear button has been clicked (simply remove the input text from the first pane)
    const clearButtonClicked = () => {
        setInputText("");
    }

    //Use Effect -> builds dictionary and generates text each time the model type is changed or a Wikipedia article is imported and the enable button is disabled.
    useEffect (() => {
        //Check if the button is not enabled and that manual text generation is not currently being done
        if (!enableButton) {
            //Trigger dictionary generation
            setNGramDict(build_dictionary(inputText, modelType));
            //Set Wikipedia Import flag to false
            setWikiImported(false);
        }
    }, [modelType, wikiImported])

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
                <div className = "header-and-import" class = "flex-auto flex-col w-6/12 space-y-2">
                    <div className = "text-entrance-text" class = "flex h-2/3 monitor:text-lg 2xl:text-sm xl:text-sm sm:text-xs font-bold">[1] Paste in Text, Import from Wikipedia.</div>
                    <div className = "button-options" class = "flex flex-row w-full h-full space-x-2">
                        { enableButton ? (
                            <button className = "build-ngram-dict" onClick = {rebuild_dict_clicked} class = "flex-auto w-9/12 bg-black text-white font-bold rounded-md outline outline-1 hover:bg-slate-700 hover:ring monitor:text-base 2xl:text-sm xl:text-sm sm:text-xs">Re-Build Dictionary</button>
                        ) : (
                            <button className = "build-ngram-dict" class = "flex-auto w-6/12 bg-gray-200 text-gray-300 font-bold rounded-md outline outline-1 monitor:text-base 2xl:text-sm xl:text-sm sm:text-xs">Re-Build Dictionary</button>
                        )}
                        <button className = "clear-button" onClick = {clearButtonClicked} class = "flex-auto w-3/12 bg-zinc-50 outline outline-1 rounded-md font-bold text-black hover:bg-slate-200 hover:ring monitor:text-base 2xl:text-sm xl:text-sm sm:text-xs">Clear</button>
                    </div>
                </div>
                <div className = "wikipedia-pane" class = "flex flex-row w-7/12 h-full rounded-md space-x-2 items-end align-right text-center justify-end">
                    <div className = "wikipedia-outline" class = "flex flex-row w-11/12 h-full rounded-md outline outline-2 outline-green-800 px-2 py-2 space-x-2 items-center align-center text-center justify-center">
                        <textarea className = "wiki-search-area" onChange = {wikiTitleChange} class = "flex text-xs w-8/12 h-full overflow-x-auto overflow-hidden text-center items-center justify-center overflow-none rounded-lg outline outline-slate-200 focus:outline-none focus:ring focus:border-slate-500" defaultValue = "🔍Search for a Wikipedia Article."></textarea>
                        <button className = "import-from-wiki" onClick = {importWikiArticle} class = "flex w-3/12 h-full rounded-md font-bold bg-green-900 text-white text-center align-center items-center self-center justify-center monitor:text-sm 2xl:text-sm xl:text-xs sm:text-xs hover:bg-slate-700 hover:ring">Import</button>            
                    </div>
                    
                </div>
                
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