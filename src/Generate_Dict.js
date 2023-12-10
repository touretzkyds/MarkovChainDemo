import React, {useState, useEffect} from "react";
import ReactDOM from 'react-dom';
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
      .trim();
  
    return cleanedText;
  };

export default function GenerateDict(props){
    //Get dictionary, branching factor, and number of bigrams from context manager
    const {inputText, setInputText, enableButton, setEnableButton, 
           nGramDict, setNGramDict, modelType, setModelType, 
           branchingFactor, setBranchingFactor, generatedText, 
           setGeneratedText, wordCount, textGenMode, build_dictionary, generate_text} = useDictContext();
    
    //Text provided state
    let [validText, setValidText] = useState(true);
    //Dictionary generated state
    let {dictGenerated, setDictGenerated} = props;

    //Wikipedia Article Title
    const [wikiArticleTitle, setWikiArticleTitle] = useState("🔍Search for a Wikipedia Article.");

    //To verify if a Wikipedia article has been imported
    const [wikiImported, setWikiImported] = useState(false);

    //To check if a Wikipedia article import has failed
    const [wikiImportSuccessful, setWikiImportSuccesful] = useState(true);

    //If the clear button for pane one has been clicked
    const [clearPaneOneClicked, setClearPaneOneClicked] = useState(false);

    //When text is entered into the textarea
    const textRetrieval = (text) => {
        //Whenever this is the case, change the state of the clear button (for pane one) to false
        setClearPaneOneClicked(false);
        //Set input text
        setInputText(text.target.value)
        //Check if we are not currently performing manual text generation
        setEnableButton(true);
        // if (textGenMode != "manual") {
        //     //Enable the Re-Build Dictionary Button
            
        // }
    }

    //When the title of the input Wikipedia article has been changed
    const wikiTitleChange = (title) => {
        //If the last import was unsuccessful, change the flag to true again
        if (!wikiImportSuccessful) {
            setWikiImportSuccesful(true);
            setInputText("");
        }
        //Set the clear pane status to false
        setClearPaneOneClicked(false);
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

        }
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
            `https://en.wikipedia.org/w/api.php?action=parse&format=json&page=${formattedTitle}&prop=sections|wikitext&origin=*`
        );
    
        // Get all sections from the response
        const data = wikiResponse.data;
        console.log("WIKI RESPONSE:", wikiResponse);
        
        

        // Check if the extraction was successful
        if (data?.parse?.sections === undefined) {
            console.log("Request succeeded, but given title is invalid.");
    
            // Simulate the clear button being clicked
            clearButtonClicked();
    
            setInputText("Could not find article named '" + formattedTitle + "'. Please check spelling and capitalization.");
            setWikiArticleTitle("");
            
            // Set the successful import flag to false
            setWikiImportSuccesful(false);
            
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
                setWikiImportSuccesful(false);
                
                // Set the Wikipedia imported flag to false
                setWikiImported(false);
            } else {
                console.log("Request succeeded.");
                // Set the input text with the content of all sections
                setInputText(allSectionsText);
        
                // Set the Wikipedia Imported flag to true
                setWikiImported(true);
                
                // Set the successful import flag to true
                setWikiImportSuccesful(true);
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
        //Trigger flag
        setClearPaneOneClicked(true);
        
        //Set all other states to their default values
        setInputText("");
        setNGramDict({});
        setBranchingFactor(0);
        setWikiArticleTitle("🔍Search for a Wikipedia Article.");
        setGeneratedText("Enter text or import in pane one first.");
        setWikiImported(false);
        setWikiImportSuccesful(true);

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
        //Check to verify that manual text generation has not taken place and that the clear button has not been clicked
        //Also check that we are not in the state just after the clear button has been clicked
        if (textGenMode != "manual" && Object.keys(nGramDict).length !== 0) {
            setGeneratedText(generate_text(nGramDict, modelType, wordCount));
        }
    }, [nGramDict, wordCount])

    //HTML
    return (
        <div className = "text-processing" class = "flex flex-col space-y-2 h-full w-full items-center justify-center rounded-md bg-zinc-50 drop-shadow-md" >
            <div className = "panel-1-header" class = "flex flex-row h-fit w-11/12 align-center items-center justify-center space-x-2">
                <div className = "header-and-import" class = "flex-auto flex-col w-6/12 space-y-2">
                    <div className = "text-entrance-text" class = "flex h-2/3 monitor:text-lg 2xl:text-sm xl:text-sm sm:text-xs font-bold">[1] Paste in Text or Import from Wikipedia.</div>
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
                        {wikiImportSuccessful ? (
                            <div className = "wikipedia-import-successful" class = "flex flex-row items-center align-center justify-center space-x-2 w-full h-full">
                                <textarea className = "wiki-search-area" onChange = {wikiTitleChange} onKeyDown = {wikiEnterButton} class = "flex text-xs w-8/12 h-full overflow-x-auto overflow-hidden text-center items-center justify-center overflow-none rounded-lg outline outline-slate-200 focus:outline-none focus:ring focus:border-slate-500" value = {wikiArticleTitle}></textarea>
                                <button className = "import-from-wiki" onClick = {importWikiArticle} class = "flex w-3/12 h-full rounded-md font-bold bg-green-900 text-white text-center align-center items-center self-center justify-center monitor:text-sm 2xl:text-sm xl:text-xs sm:text-xs hover:bg-slate-700 hover:ring">Import</button> 
                            </div>   
                        ) : (
                            <div className = "wikipedia-import-successful" class = "flex flex-row items-center align-center justify-center space-x-2 w-full h-full">
                                <textarea className = "wiki-search-area" onChange = {wikiTitleChange} onKeyDown = {wikiEnterButton} class = "flex text-xs w-8/12 h-full overflow-x-auto overflow-hidden text-center items-center justify-center overflow-none rounded-lg outline outline-slate-200 focus:outline-none focus:ring focus:border-slate-500" value = {wikiArticleTitle}></textarea>
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