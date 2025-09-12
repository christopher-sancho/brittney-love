import { useState, useEffect, useRef } from 'react'
import './App.css'

function App() {
  const [step, setStep] = useState('welcome') // welcome, name-check, collect-message, ask-another, ask-picture, view-messages
  const [userName, setUserName] = useState('')
  const [currentMessage, setCurrentMessage] = useState('')
  const [selectedImage, setSelectedImage] = useState(null)
  const [messages, setMessages] = useState([])
  const [chatMessages, setChatMessages] = useState([])
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  // Load messages from localStorage on component mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('brittney-birthday-messages')
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages))
    }
  }, [])

  // Auto-scroll to bottom when new chat messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages])

  // Add a chat message with typing animation
  const addChatMessage = (text, isUser = false, delay = 1000) => {
    setTimeout(() => {
      setChatMessages(prev => [...prev, { text, isUser, timestamp: Date.now() }])
    }, delay)
  }

  // Initialize welcome flow
  useEffect(() => {
    if (step === 'welcome') {
      setChatMessages([])
      addChatMessage("Hey there! 👋", false, 500)
      addChatMessage("I'm here to help collect some special birthday messages for Brittney! 🎉💕", false, 1500)
      addChatMessage("First, let me ask - are you Savanna Brittney Sancho (nee Ramkissoon)?", false, 3000)
    }
  }, [step])

  const handleNameResponse = (isBrittney) => {
    if (isBrittney) {
      addChatMessage("Yes, that's me! 💕", true, 0)
      addChatMessage("Hi Brittney! 🥳✨", false, 1000)
      addChatMessage("Happy Birthday, beautiful! 🎂💕", false, 2000)
      addChatMessage("Here are some wonderful messages from your favorite people:", false, 3500)
      setTimeout(() => setStep('view-messages'), 4500)
    } else {
      addChatMessage("No, that's not me", true, 0)
      addChatMessage("Perfect! What's your name? 😊", false, 1000)
      setTimeout(() => setStep('name-check'), 2000)
    }
  }

  const handleNameSubmit = (e) => {
    e.preventDefault()
    if (userName.trim()) {
      addChatMessage(userName, true, 0)
      addChatMessage(`Nice to meet you, ${userName}! 😊`, false, 1000)
      addChatMessage("Would you like to leave a fun/loving message or share your favorite memory of Brittney?", false, 2500)
      setTimeout(() => setStep('collect-message'), 3500)
    }
  }

  const handleMessageSubmit = (e) => {
    e.preventDefault()
    if (currentMessage.trim()) {
      const newMessage = {
        id: Date.now(),
        name: userName,
        message: currentMessage,
        image: selectedImage,
        timestamp: new Date().toISOString()
      }
      
      const updatedMessages = [...messages, newMessage]
      setMessages(updatedMessages)
      localStorage.setItem('brittney-birthday-messages', JSON.stringify(updatedMessages))
      
      addChatMessage(currentMessage, true, 0)
      addChatMessage("Thank you so much! ❤️ Your message has been saved for Brittney's birthday! 🎉", false, 1000)
      addChatMessage("Would you like to share another memory or message? 😊", false, 2500)
      
      // Reset form
      setCurrentMessage('')
      setSelectedImage(null)
      setTimeout(() => setStep('ask-another'), 3500)
    }
  }

  const handleAnotherMemory = (wantsAnother) => {
    if (wantsAnother) {
      addChatMessage("Yes, I'd love to share another! 💕", true, 0)
      addChatMessage("Wonderful! What else would you like to share about Brittney? 🥰", false, 1000)
      setTimeout(() => setStep('collect-message'), 2000)
    } else {
      addChatMessage("No, that's all for now 😊", true, 0)
      addChatMessage("Perfect! Would you like to share a favorite picture of Brittney? 📸✨", false, 1000)
      setTimeout(() => setStep('ask-picture'), 2500)
    }
  }

  const handlePictureResponse = (wantsPicture) => {
    if (wantsPicture) {
      addChatMessage("Yes, I'd love to share a picture! 📸", true, 0)
      addChatMessage("Amazing! Please select your favorite picture of Brittney below 💕", false, 1000)
      setTimeout(() => {
        fileInputRef.current?.click()
      }, 2000)
    } else {
      addChatMessage("No pictures this time 😊", true, 0)
      addChatMessage("That's perfectly fine! Thank you so much for your beautiful message! 🎉💕", false, 1000)
      addChatMessage("Brittney is going to be so happy! 🥰", false, 2500)
      setTimeout(() => {
        setStep('welcome')
        setUserName('')
      }, 4000)
    }
  }

  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const imageData = event.target.result
        setSelectedImage(imageData)
        
        // Save the image with a message
        const imageMessage = {
          id: Date.now(),
          name: userName,
          message: "Shared a favorite picture! 📸💕",
          image: imageData,
          timestamp: new Date().toISOString()
        }
        
        const updatedMessages = [...messages, imageMessage]
        setMessages(updatedMessages)
        localStorage.setItem('brittney-birthday-messages', JSON.stringify(updatedMessages))
        
        addChatMessage("Perfect! Your picture has been added! 📸✨", false, 1000)
        addChatMessage("Thank you for sharing such a beautiful memory! 💕", false, 2500)
        addChatMessage("Brittney is going to love this! 🥰", false, 4000)
        
        setTimeout(() => {
          setStep('welcome')
          setUserName('')
        }, 5500)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="app">
      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-left">
          <span className="time">
            {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </span>
        </div>
        <div className="status-center">
          <div className="notch"></div>
        </div>
        <div className="status-right">
          <div className="battery">
            <div className="battery-level"></div>
          </div>
          <span className="signal">📶</span>
        </div>
      </div>

      {/* Header */}
      <div className="header">
        <div className="contact-info">
          <div className="avatar">
            💕
          </div>
          <div className="contact-details">
            <div className="contact-name">Birthday Messages</div>
            <div className="contact-status">for Brittney ✨</div>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="messages-container">
        {step === 'view-messages' ? (
          <div className="birthday-messages">
            <div className="birthday-header">
              <h2>💕 Happy Birthday Brittney! 🎂</h2>
              <p>Messages from people who love you:</p>
            </div>
            {messages.length === 0 ? (
              <div className="no-messages">
                <p>No messages yet! Share the link with friends and family! 💕</p>
              </div>
            ) : (
              <div className="messages-list">
                {messages.map((msg) => (
                  <div key={msg.id} className="birthday-message">
                    <div className="message-author">From: {msg.name} 💕</div>
                    <div className="message-content">{msg.message}</div>
                    {msg.image && (
                      <div className="message-image">
                        <img src={msg.image} alt="Shared memory" />
                      </div>
                    )}
                    <div className="message-time">
                      {new Date(msg.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button 
              className="back-button"
              onClick={() => setStep('welcome')}
            >
              ← Back to start
            </button>
          </div>
        ) : (
          <div className="chat-messages">
            {chatMessages.map((msg, index) => (
              <div key={index} className={`message ${msg.isUser ? 'user' : 'bot'}`}>
                <div className="message-bubble">
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageSelect}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {/* Input Area */}
      {step !== 'view-messages' && (
        <div className="input-container">
          {step === 'welcome' && (
            <div className="response-buttons">
              <button 
                className="response-btn yes"
                onClick={() => handleNameResponse(true)}
              >
                Yes, that's me! 💕
              </button>
              <button 
                className="response-btn no"
                onClick={() => handleNameResponse(false)}
              >
                No, that's not me
              </button>
            </div>
          )}

          {step === 'name-check' && (
            <form onSubmit={handleNameSubmit} className="input-form">
              <div className="input-wrapper">
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your name..."
                  className="text-input"
                  autoFocus
                />
                <button type="submit" className="send-btn">
                  ➤
                </button>
              </div>
            </form>
          )}

          {step === 'collect-message' && (
            <form onSubmit={handleMessageSubmit} className="input-form">
              <div className="input-wrapper">
                <textarea
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  placeholder="Share your message or favorite memory..."
                  className="text-input message-input"
                  rows="3"
                  autoFocus
                />
                <button type="submit" className="send-btn">
                  ➤
                </button>
              </div>
            </form>
          )}

          {step === 'ask-another' && (
            <div className="response-buttons">
              <button 
                className="response-btn yes"
                onClick={() => handleAnotherMemory(true)}
              >
                Yes, I'd love to share another! 💕
              </button>
              <button 
                className="response-btn no"
                onClick={() => handleAnotherMemory(false)}
              >
                No, that's all for now 😊
              </button>
            </div>
          )}

          {step === 'ask-picture' && (
            <div className="response-buttons">
              <button 
                className="response-btn yes"
                onClick={() => handlePictureResponse(true)}
              >
                Yes, I'd love to share a picture! 📸
              </button>
              <button 
                className="response-btn no"
                onClick={() => handlePictureResponse(false)}
              >
                No pictures this time 😊
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default App
