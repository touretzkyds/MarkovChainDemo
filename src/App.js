import './App.css';
import React, {useState, useEffect} from "react";
import GenerateDict from './Generate_Dict';
import GeneratePassage from './Generate_Passage';
import {v4 as uuidv4} from 'uuid';
import DisplayDict from './Display_Dict';
import Visualizations from './Visualizations';
import { DictContextProvider } from './Context';
import "./homepage.css"
//From opening new webpages 

export default function App() {
  //Declare user id
  const gen_id = uuidv4();
  const [userID, setUserID] = useState(gen_id);
  //About Window object
  const [aboutWindow, setAboutWindow] = useState();
  
  //Check whether the dictionary has been generated
  let [dictGenerated, setDictGenerated] = useState(false);

  //The About window when the respective button is clicked
  const openAboutWindow = () => {
    const aboutPath = `${process.env.PUBLIC_URL}/about.html`;
    const about_window = window.open(aboutPath, '_blank');
    // Set the window to the object
    setAboutWindow(about_window);
  };

  return (
    <DictContextProvider>
      <div className = "application-frame" class = "h-screen w-screen flex flex-col items-center justify-center py-5" >
        <div className = "application" class = "flex flex-col h-full w-11/12 text-left divide-y divide-solid">
          <div className = "header-obj" class = "custom-header">
            <div className = "header-text-col" class = "flex flex-col w-full">
              <div className = "heading" class = "flex flex-row w-full h-full space-x-5">
                <div className = "header-text" class = "text-2xl font-bold">Markov Chain Demo</div>
                <button className = "about-button" onClick = {openAboutWindow} class = "bg-white text-black font-bold hover:bg-black hover:text-white hover:ring rounded-md w-1/12 h-full outline outline-1">About</button>
              </div>
              
              <div className = "subheader-text" class = "">A tool to explore and tinker with n-grams - a statistical precursor to Large Language Models (LLMs).</div>
            </div> 
          </div>
          <div className = "application-body" class = "custom-application-body">
              <GenerateDict userID = {userID} dictGenerated = {dictGenerated} setDictGenerated = {setDictGenerated}/>
              <DisplayDict/>
              <GeneratePassage userID = {userID}/>
              <Visualizations/>
          </div>
        </div>
      </div>
    </DictContextProvider>
  );
}