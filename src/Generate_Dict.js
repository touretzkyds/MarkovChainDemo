import React, {useState, useEffect} from "react";
import axios from "axios";
import { useDictContext } from "./Context";

function removeHtmlTags(htmlString) {
    const doc = new DOMParser().parseFromString(htmlString, 'text/html');

    // Remove elements with specific classes or styles
    const elementsToRemove = doc.querySelectorAll('.mw-parser-output .cs1-ws-icon'); // Add other selectors as needed
    elementsToRemove.forEach((element) => element.remove());
  
    return doc.body.textContent || '';
}

const cleanWikiText = (wikiText) => {
    // Remove known patterns or styles
    const cleanedText = wikiText
      .replace(/\.mw-parser-output.*?{.*?}/g, '') // Remove styles
      .replace(/(?:\[.*?\])|(?:\{\{.*?\}\})|(?:<ref.*?<\/ref>)/gs, '') // Remove citations, templates, etc.
      .replace(/@media.*?\{.*?\}/g, '') //Remove CSS tags
      .replace(/body:[^\{]+/g, '')
      .replace(/skin-\S+/g, '') //Remove more complex CSS tags, such as .body and skin themes
      .trim();
  
    return cleanedText;
  };

export default function GenerateDict(props){
    //Get dictionary, branching factor, and number of bigrams from context manager
    const {inputText, setInputText, enableButton, setEnableButton, panesCleared, setPanesCleared,
           nGramDict, setNGramDict, modelType, frequencies, setBranchingFactor, 
           generatedText, setGeneratedText, setManualGeneratedText, wordCount, tokenCount, setTokenCount, setGraphData,
           textGenMode, get_words, build_dictionary, generate_text, setKeysAdded, setKey, setWordOptions} = useDictContext();
    
    //Text provided state
    let [validText, setValidText] = useState(true);

    //Wikipedia Article Title
    const [wikiArticleTitle, setWikiArticleTitle] = useState("🔍Search for a Wikipedia Article.");

    //To verify if a Wikipedia article has been imported
    const [wikiImported, setWikiImported] = useState(false);

    //To check if a Wikipedia article import has failed
    const [wikiImportSuccessful, setWikiImportSuccessful] = useState(true);

    //When text is entered into the textarea
    const textRetrieval = (text) => {
        //Set input text
        setInputText(text.target.value)
        //Check if we are not currently performing manual text generation
        setEnableButton(true);
        //Clear panes 2-4
        setNGramDict(new Map());
        setBranchingFactor(0);
        setWikiArticleTitle("🔍Search for a Wikipedia Article.");
        setGeneratedText("Enter text, import, or re-build dictionary in pane one first.");
        setWikiImported(false);
        setWikiImportSuccessful(true);
    }

    //To update the token count
    useEffect(() => {
        //Update the token count if the length of the words is nonzero, otherwise set to zero
        if (inputText === "") {setTokenCount(0);}
        else {get_words(inputText);}

        //The following line suppresses warnings regarding not including some variables in the useEffect dependency array.
        //This is INTENTIONAL - said variables are NOT supposed to influence the given useEffect hook. 
        //eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inputText])

    //When the title of the input Wikipedia article has been changed
    const wikiTitleChange = (title) => {
        //If the last import was unsuccessful, change the flag to true again
        if (!wikiImportSuccessful) {
            setWikiImportSuccessful(true);
            setInputText("");
        }
        //Set title
        setWikiArticleTitle(title.target.value);

    }

    //Mapping clicking the enter key to the submit button
    const wikiEnterButton = (event) => {
        //Check if the enter key has been clicked
        if (event.key === "Enter" && !event.shiftKey) {
            //Prevent default enter key behaviour and trigger import button
            event.preventDefault();
            importWikiArticle();
            const wikiTitle = wikiArticleTitle;
            clearButtonClicked();
            setWikiArticleTitle(wikiTitle);
            if (textGenMode !== "manual") {setGeneratedText("Please wait while we load the specified text...");}
            
        }
    }

    //Function for the import button
    //Mapping clicking the enter key to the submit button
    const importButtonClicked = () => {
        importWikiArticle();
        const wikiTitle = wikiArticleTitle;
        clearButtonClicked();
        setWikiArticleTitle(wikiTitle);

        setGeneratedText("Please wait while we load the specified text...");

    }

    //For when the Wikipedia input area is clicked
    const wikiInputClicked = () => {
        setWikiArticleTitle("");
    }

    // Function to fetch the content of a specific section
    const fetchSectionContent = async (formattedTitle, sectionIndex) => {
        try {
        const sectionApiUrl = `https://en.wikipedia.org/w/api.php?action=parse&format=json&page=${formattedTitle}&section=${sectionIndex}&origin=*`;
        const sectionResponse = await axios.get(sectionApiUrl);
        const sectionData = sectionResponse.data;
        return sectionData.parse.text['*'];
        } catch (error) {
        console.error('Error fetching Wikipedia section content:', error);
        return 'Error fetching section content.';
        }
    };
    
    // When an article is attempting to be imported from Wikipedia
    const importWikiArticle = async () => {
        // Replace all spaces in text with underscores
        const formattedTitle = wikiArticleTitle.replaceAll(" ", "_");
    
        try {
            console.log("Sending request to Wikipedia for article '" + formattedTitle + "'...");
            // Request to get the associated Wikipedia article with sections and wikitext
            const wikiResponse = await axios.get(
                `https://en.wikipedia.org/w/api.php?action=parse&explaintext=true&format=json&page=${formattedTitle}&prop=sections|wikitext&origin=*&`
            );
        
            // Get all sections from the response
            const data = wikiResponse.data;

            // Check if the extraction was successful
            if (data?.parse?.sections === undefined) {
                console.log("Request succeeded, but given title is invalid.");
        
                // Simulate the clear button being clicked
                clearButtonClicked();
        
                setInputText("Could not find article named '" + formattedTitle + "'. Please check spelling and capitalization.");
                setWikiArticleTitle("");
                
                // Set the successful import flag to false
                setWikiImportSuccessful(false);
                
                // Set the Wikipedia imported flag to false
                setWikiImported(false);
            } else {
                
                const sections = data.parse.sections || [];
                // Fetch content for each section
                const sectionsContent = await Promise.all(
                    sections.map(async (section) => {
                    const sectionText = await fetchSectionContent(formattedTitle, section.index);
                    return {
                        title: section.line,
                        content: removeHtmlTags(sectionText).trim().replace("\n\n", "\n"),
                    };
                    })
                );
                
                // Concatenate the content of all sections
                const allSectionsText = sectionsContent
                .map((section) => `${section.title}\n\n${cleanWikiText(removeHtmlTags(section.content))}`)
                .join('\n\n');

                if (allSectionsText === "") {
                    console.log("Request succeeded, but given title is invalid.");
        
                    // Simulate the clear button being clicked
                    clearButtonClicked();
            
                    setInputText("Could not find article named '" + formattedTitle + "'. Please check spelling and capitalization.");
                    setWikiArticleTitle("");
                    
                    // Set the successful import flag to false
                    setWikiImportSuccessful(false);
                    
                    // Set the Wikipedia imported flag to false
                    setWikiImported(false);
                } else {
                    console.log("Request succeeded.");
                    // Set the input text with the content of all sections
                    setInputText(allSectionsText);
            
                    // Set the Wikipedia Imported flag to true
                    setWikiImported(true);
                    
                    // Set the successful import flag to true
                    setWikiImportSuccessful(true);
                }
            }
        } catch (error) {
            console.log("Request to Wikipedia failed.");
            console.log(error);
        }
    };
    

    //When the re-build dictionary button is clicked
    const rebuild_dict_clicked = () => {
        //Verify that adequate text has been provided
        if (inputText.split(/\s+/).filter(word => word !== "").length < 2) {
            setValidText(false);
            clearButtonClicked();
        }
        else {
            setValidText(true);
            //Update nGram dictionary
            setNGramDict(build_dictionary(inputText, modelType));
    
            //Set enable button to false
            setEnableButton(false);
        }
        
    }

    //Handle when the clear button has been clicked (simply remove the input text from the first pane)
    const clearButtonClicked = () => {

        //Set all states to their default values
        setInputText("");
        setGeneratedText("");
        setGraphData([]);
        setWordOptions([]);
        setManualGeneratedText("");
        setNGramDict(new Map());
        setBranchingFactor(0);
        setWikiArticleTitle("🔍Search for a Wikipedia Article.");
        if (textGenMode !== "manual") {setGeneratedText("Enter text or import in pane one first.");}
        setWikiImported(false);
        setWikiImportSuccessful(true);

    }

    //Each time the model type changes, clear the panes. Only begin rendering the dictionary when pane clearing is complete
    useEffect(() => {
        
        //Set generated text to an empty string and nGramDict to an empty map
        setGeneratedText("");
        setManualGeneratedText("");
        setNGramDict(new Map(""));
        //Delete the graph
        setGraphData([]);
        
        //Then, turn panes cleared to true
        setPanesCleared(true);

    }, [modelType])

    //Use Effect -> builds dictionary and generates text each time the model type is changed or a Wikipedia article is imported and the enable button is disabled.
    useEffect (() => {

        if (!enableButton && panesCleared) {
            setNGramDict(new Map());
            //Trigger dictionary generation
            // setGeneratedText("");
            // setKeysAdded([]);
            // //Clear all values
            // setKey("");
            // setWordOptions([])
            setNGramDict(build_dictionary(inputText, modelType));

            //Set panes cleared to false
            setPanesCleared(false)
        }

        //The following line suppresses warnings regarding not including some variables in the useEffect dependency array.
        //This is INTENTIONAL - said variables are NOT supposed to influence the given useEffect hook. 
        //eslint-disable-next-line react-hooks/exhaustive-deps
    }, [modelType, panesCleared, textGenMode])

    useEffect(() => {

        if (wikiImported) {
            //Trigger dictionary generation
            setNGramDict(build_dictionary(inputText, modelType));
            //Set Wikipedia Import flag to false
            setWikiImported(false);
        }

        //The following line suppresses warnings regarding not including some variables in the useEffect dependency array.
        //This is INTENTIONAL - said variables are NOT supposed to influence the given useEffect hook. 
        //eslint-disable-next-line react-hooks/exhaustive-deps
    }, [wikiImported])

    //Generate Text when the dictionary is altered. 
    useEffect(() => {
        //Check to verify that manual text generation has not taken place and that the clear button has not been clicked
        //Also check that we are not in the state just after the clear button has been clicked
        //Finally, verify that the frequencies dictionary has been built
        if (textGenMode !== "manual" && nGramDict.size !== 0 && Object.keys(frequencies).length !== 0) {
            setGeneratedText(generate_text(nGramDict, modelType, wordCount));
        }

        //The following line suppresses warnings regarding not including some variables in the useEffect dependency array.
        //This is INTENTIONAL - said variables are NOT supposed to influence the given useEffect hook. 
        //eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nGramDict, wordCount, frequencies])

    //HTML
    return (
        <div className = "text-processing" class = "flex flex-col space-y-2 h-full w-full items-center justify-center rounded-md bg-zinc-50 drop-shadow-md" >
            <div className = "panel-1-header" class = "flex flex-row h-fit w-11/12 align-center items-center justify-center space-x-2">
                <div className = "header-and-import" class = "flex-auto flex-col w-6/12 space-y-2">
                    <div className = "text-entrance-text" class = "flex h-2/3 monitor:text-lg 2xl:text-sm xl:text-sm sm:text-xs font-bold">[1] Paste in Text or Import from Wikipedia.</div>
                    <div className = "button-options" class = "flex flex-row w-full h-full space-x-2">
                        <div className = "token-counter" class = "flex-auto w-3/12 text-xs text-center">Token Count: {tokenCount}</div>
                        { enableButton ? (
                            <button className = "build-ngram-dict" onClick = {rebuild_dict_clicked} class = "flex-auto w-6/12 bg-black text-white font-bold rounded-md outline outline-1 hover:bg-slate-700 hover:ring monitor:text-base 2xl:text-sm xl:text-sm sm:text-xs">Re-Build Dictionary</button>
                        ) : (
                            <button className = "build-ngram-dict" class = "flex-auto w-6/12 bg-gray-200 text-gray-300 font-bold rounded-md outline outline-1 monitor:text-base 2xl:text-sm xl:text-sm sm:text-xs">Re-Build Dictionary</button>
                        )}
                        <button className = "clear-button" onClick = {clearButtonClicked} class = "flex-auto w-2/12 bg-zinc-50 outline outline-1 rounded-md font-bold text-black hover:bg-slate-200 hover:ring monitor:text-base 2xl:text-sm xl:text-sm sm:text-xs">Clear</button>
                    </div>
                </div>
                <div className = "wikipedia-pane" class = "flex flex-row w-7/12 h-full rounded-md space-x-2 items-end align-right text-center justify-end">
                    <div className = "wikipedia-outline" class = "flex flex-row w-11/12 h-full rounded-md outline outline-2 outline-green-800 px-2 py-2 space-x-2 items-center align-center text-center justify-center">
                        {wikiImportSuccessful ? (
                            <div className = "wikipedia-import-successful" class = "flex flex-row items-center align-center justify-center space-x-2 w-full h-full">
                                <textarea className = "wiki-search-area" onChange = {wikiTitleChange} onKeyDown = {wikiEnterButton} onClick = {wikiInputClicked} class = "flex text-sm w-8/12 h-full overflow-x-auto overflow-hidden text-center items-center justify-center overflow-none rounded-lg outline outline-slate-200 focus:outline-none focus:ring focus:border-slate-500" value = {wikiArticleTitle}></textarea>
                                <button className = "import-from-wiki" onClick = {importButtonClicked} class = "flex w-3/12 h-full rounded-md font-bold bg-green-900 text-white text-center align-center items-center self-center justify-center monitor:text-sm 2xl:text-sm xl:text-xs sm:text-xs hover:bg-slate-700 hover:ring">Import</button> 
                            </div>   
                        ) : (
                            <div className = "wikipedia-import-successful" class = "flex flex-row items-center align-center justify-center space-x-2 w-full h-full">
                                <textarea className = "wiki-search-area" onChange = {wikiTitleChange} onKeyDown = {wikiEnterButton} onClick = {wikiInputClicked} class = "flex text-xs w-8/12 h-full overflow-x-auto overflow-hidden text-center items-center justify-center overflow-none rounded-lg outline outline-slate-200 focus:outline-none focus:ring focus:border-slate-500" value = {wikiArticleTitle}></textarea>
                                <button className = "import-from-wiki" class = "flex w-3/12 h-full rounded-md font-bold bg-gray-200 text-gray-300 text-center align-center items-center self-center justify-center monitor:text-sm 2xl:text-sm xl:text-xs sm:text-xs">Import</button> 
                            </div>  
                            
                        )}
                    </div>
                    
                </div>
                
            </div>
            {wikiImportSuccessful ? (
                <textarea className = "gram-model-text" type = "textarea" defaultValue = {inputText} onChange = {textRetrieval} value = {inputText} class = "rounded-md p-2 h-5/6 w-11/12 outline outline-slate-200 focus:outline-none focus:ring focus:border-slate-500"></textarea>
            ) : (
                <textarea className = "gram-model-text" type = "textarea" defaultValue = {inputText} onChange = {textRetrieval} value = {inputText} class = "text-red-500 rounded-md p-2 h-5/6 w-11/12 outline outline-slate-200 focus:outline-none focus:ring focus:border-slate-500"></textarea>
            )}
            
            {/* Display the text generation option if clicked is true*/}
            {validText ? (
                <div></div>
            ) : (
                <div className = "no-text-provided" class = "text-red-500 text-sm font-bold">Please provide a sample input passage with at least 2 words.</div>
            )}
        </div>
    )
}