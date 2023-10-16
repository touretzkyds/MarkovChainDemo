import React, {useState, useEffect, useRef} from "react";
import Modal from "react-modal";

Modal.setAppElement('#root');

//Modal component
const WikpediaImport = ({isOpen, onRequestClose, content }) => {
    return (
        <Modal
            isOpen = {isOpen}
            onRequestClose = {onRequestClose}
            style = {{
                overlay: {
                    backgroundColor: 'rgba(0, 0, 0, 0.5)'
                },
                content: {
                    top: '50%',
                    left: '50%',
                    right: 'auto',
                    bottom: 'auto',
                    marginRight: '-50%',
                    transform: 'translate(-50%, -50%)'
                }
            }}
        >
            <button onClick = {onRequestClose}>❌</button>
            <div className = "search-body" class = "flex flex-col w-full h-full align-center items-center justify-center space-y-2">
                {content}
                <div className = "search-area" class = "flex flex-row w-10/12 h-1/12 space-x-3">
                    <textarea className = "search-area" class = "w-10/12 h-1/12 rounded-md p-2 outline outline-slate-200 focus:outline-none focus:ring focus:border-slate-500"></textarea>
                    <button className = "search-button" class = "w-2/12 h-1/12 rounded-md bg-green-100 hover hover:bg-green-500">🔍</button>
                </div>
                
            </div>
            
        </Modal>
    )
}

export default WikpediaImport;