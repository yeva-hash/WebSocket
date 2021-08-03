import { io, Socket } from "socket.io-client";

import {regisButton} from "./ElementsDOM"
import {nameInput} from "./ElementsDOM"
import {regisBlock} from "./ElementsDOM"

import {channelsBlock} from "./ElementsDOM"
import {mainBlock} from "./ElementsDOM"

import {arrOfChannels} from "./data"
import {IChannel} from "./data"
import {UserInfoI} from "./data"

import {activeUsers} from "./ElementsDOM"
import {sendMessageButton} from "./ElementsDOM"
import {messageInput} from "./ElementsDOM"
import {mainChatBlock} from "./ElementsDOM"
import {anonymBlock} from "./ElementsDOM"

interface arrOfUsersMessagesI {
    socketId:string,
    message:string
}

let connectedUsers: Record<string,string> = {}
let connectedUsersForRoom: UserInfoI[] = []
let arrOfUsersId:string[] = []

let arrOfUsersMessages:arrOfUsersMessagesI[] = []
const socket: Socket = io("ws://bt-21-playground-vppfc.ondigitalocean.app/");

let leaveROOM_ID:string | undefined = "0"

regisButton?.addEventListener("click", registerUser)
sendMessageButton?.addEventListener("click",() => {
    let message = (messageInput as HTMLInputElement).value
    let name = (nameInput as HTMLInputElement).value
    socket.emit('msg_to_room', (messageInput as HTMLInputElement).value,leaveROOM_ID)
    renderMessageContainer(name,message, leaveROOM_ID)
    if(leaveROOM_ID) {
      setMessageInLocaleStorage(leaveROOM_ID,name,message)  
    }
})

socket.on("connect", () => {
    // setAnonymUser() 
    socket.on("registration_completed", () => {});
    socket.on('join_success', (roomId) => {})
    socket.on('leave_success', (roomId) => { })
    socket.on("new_user_connected", (socketId) => {});
    socket.on("user_registered", (username, socketId) => {
        const user = {
            id:socketId,
            name:username
        }
        addUsersToArr(user)
    });
    socket.on('new_message_to_room', (message, roomId, userId) => {
        console.log(`new message from ${userId} to room ${roomId}: ${message}`)
        takeUserName(message,roomId,userId)
        setMessageInLocaleStorage(roomId,userId,message)
     })
    socket.on('user_joined_room',(socketId,roomId) => {
        (activeUsers as HTMLDivElement).innerHTML = ""
        updateUserList(roomId)
    })
    socket.on('user_left_room', (userId, roomId) => {
        console.log(`${userId} left from room ${roomId}`);
        (activeUsers as HTMLDivElement).innerHTML = ""
        updateUserList(roomId)
     })
    socket.on("users_list", addUsersToArr);
    socket.on('users_list_for_room', addUsersToTheArrayOfRooms)
    
})
function setMessageInLocaleStorage(roomId:string,userId:string,message:string) {
    
}
function takeUserName(message:string,roomId:string,userId:string) {
    for (const [key, value] of Object.entries(connectedUsers)) {
        if(userId === key) {
            renderMessageContainer(value,message,roomId)
        }
    }
}
function renderMessageContainer(name:string,message:string,roomId:string|undefined) {
    const userMessageContainer = document.createElement("div")
    userMessageContainer.classList.add("user-message-container")
    if(name === (nameInput as HTMLInputElement).value) {
        const userMessage = `${name}: ${message} (you)`
        userMessageContainer.append(userMessage)
    } else {
        const userMessage = `${name}: ${message}`
        userMessageContainer.append(userMessage)
    }    
    mainChatBlock?.append(userMessageContainer)
}
function updateUserList(ROOM_ID:string) {
    socket.emit("get_users");
    socket.emit('get_users_for_room', ROOM_ID);
}
function addUsersToArr(users: Record<string,string>) {
    connectedUsers = {}
    connectedUsers = users
    // setAnonymUser()
}
// function setAnonymUser() { 
//     let anonymLength:number = 0 
//     for(let i of Object.values(connectedUsers)) {
//         if(i === "Anonymous") {
//             anonymLength++
//         }
//     } 
//     (anonymBlock as HTMLDivElement).textContent = JSON.stringify(anonymLength)
// }
function addUsersToTheArrayOfRooms(users:string[],ROOM_ID:string) {
    connectedUsersForRoom = []
    arrOfUsersId = []
    for(let u of users) {
        arrOfUsersId.push(u)
    }
    for (const [key, value] of Object.entries(connectedUsers)) {
        arrOfUsersId.forEach((userId) => {
                if(key === userId) {
                    const user = {
                        id:key,
                        name:value
                    }
                    connectedUsersForRoom.push(user)
                }
            })
      }  
      renderActiveUsersForRoom(connectedUsersForRoom) 
      renderActiveUser((nameInput as HTMLInputElement).value)

}
function renderActiveUsersForRoom(connectedUsersForRoom:UserInfoI[]) {
    for(let i = 0; i<connectedUsersForRoom.length;i++ ) {
        if(connectedUsersForRoom[i].name === (nameInput as HTMLInputElement).value) continue
        else renderActiveUser(connectedUsersForRoom[i].name)
    }
}
function renderActiveUser(activeUserName:string) {
    const activeUserContainer = document.createElement("p")
    activeUserContainer.classList.add("user")
    activeUsers?.append(activeUserContainer)
    activeUserContainer.textContent = activeUserName
    if(activeUserName === (nameInput as HTMLInputElement).value) {
        activeUserContainer.style.fontWeight = "bold"
    }
}
function registerUser() {
    socket.emit("get_users");
    const nameInputValue = (nameInput as HTMLInputElement).value
    socket.emit("register", nameInputValue);
    renderDOM()
}

async function getChannels() {
    fetch('https://bt-21-playground-vppfc.ondigitalocean.app/rooms')
        .then((response) => {
            return response.json();
        })
        .then((data) => {
            for(let i = 0; i<data.length; i++) {
                arrOfChannels.push(data[i])
            }
        });
}
function renderChannelsList(arrOfChannels:IChannel[]) {
    for(let i =0; i < arrOfChannels.length; i++) {
        renderChannel(arrOfChannels[i])
    }
}
function renderChannel(channel:IChannel) {
    const channelContainer = document.createElement("p")
    channelContainer.classList.add("channel")
    channelContainer.textContent = channel.title
    channelContainer.dataset.id = channel.id
    channelsBlock?.append(channelContainer)
}

function renderDOM() {
    regisBlock?.remove()

    channelsBlock?.classList.remove("channel-container-none")
    channelsBlock?.classList.add("channel-container")
    renderChannelsList(arrOfChannels)

}

function joinChannel() {
    channelsBlock?.addEventListener('click', (event) => {
        (activeUsers as HTMLDivElement).innerHTML = "";
        (mainChatBlock as HTMLDivElement).innerHTML = ""

        if((event.target as HTMLElement).classList.contains("channel")) {
            const ROOM_ID = (event.target as HTMLElement).dataset.id
            renderMainBlock(ROOM_ID)
            socket.emit('join_room', ROOM_ID)
            socket.emit('leave_room', leaveROOM_ID)
            leaveROOM_ID = ROOM_ID
        }
    })
}
function renderMainBlock(ROOM_ID:string|undefined) {
    mainBlock?.classList.remove("container-none")
    mainBlock?.classList.add("container")
    socket.emit('get_users_for_room', ROOM_ID);
}


getChannels()
joinChannel()



// 
// 




