import './App.css';
import React, {useState, useEffect} from "react";
import GenerateDict from './Generate_Dict';
import GeneratePassage from './Generate_Passage';
import {v4 as uuidv4} from 'uuid';
import DisplayDict from './Display_Dict';
import Visualizations from './Visualizations';
import { DictContextProvider } from './Context';
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
      const about_window = window.open('', '_blank');
      about_window.document.title = "About - Markov Chain Demo.";
      about_window.document.body.innerHTML = (
        "<div id = 'root_div' className = 'about_page' class = 'flex flex-col h-screen w-screen items-center justify-center py-8'>"+
          "<div className = 'application' class = 'flex flex-col h-full w-11/12 text-left divide-y divide-solid'>"+
            "<div className = 'header-text' class = 'text-2xl font-bold'><strong>About -  Markov Chain Demo.</strong></div>"+
            "<div className = 'about-page'>Developed by Dr. David Touretsky (Carnegie Mellon University) and Aditya Dewan (The Woodlands Secondary School).</div>"+
            "<div>This work was funded by National Science Foundation award IIS-2112633.</div>"+
          "</div>"+
        "</div>"
      )
      //Set the window to the object
      setAboutWindow(about_window);
  }

  return (
    <DictContextProvider>
      <div className = "application-frame" class = "h-screen w-screen flex flex-col items-center justify-center py-8" >
        <div className = "application" class = "flex flex-col h-full w-11/12 text-left divide-y divide-solid">
          <div className = "header-obj" class = "flex flex-row h-fit pb-3">
            <div className = "header-text-col" class = "flex flex-col h-full w-9/12">
              <div className = "header-text" class = "text-2xl font-bold">Markov Chain Demo.</div>
              <div className = "subheader-text" class = "">An interactive tool to learn and visualize how n-gram models - a useful technique for statistical natural language processing - operate.</div>
            </div>
            <div className = "additional-info-col" class = "flex h-full w-3/12 h-full content-end items-end justify-end">
              <button className = "about-button" onClick = {openAboutWindow} class = "bg-white text-black font-bold hover:bg-black hover:text-white hover:ring rounded-md w-3/12 h-4/6 outline outline-1">About</button>
            </div>
          </div>
          <div className = "application-body" class = "h-full grid gap-5 grid-cols-2 grid-rows-2 pt-3">
              <GenerateDict userID = {userID} dictGenerated = {dictGenerated} setDictGenerated = {setDictGenerated}/>
              <DisplayDict />
              <GeneratePassage userID = {userID}/>
              <Visualizations/>
          </div>
        </div>
      </div>
    </DictContextProvider>
  );
}