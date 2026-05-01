import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  messages: [
    {
      role: 'ai',
      content: 'Hello! I am your AI assistant. I can help you log an HCP interaction. Just tell me who you met with, when, and what was discussed.'
    }
  ],
  isStreaming: false,
};

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addUserMessage: (state, action) => {
      state.messages.push({ role: 'user', content: action.payload });
    },
    addAIMessageChunk: (state, action) => {
      // If the last message is from user, add a new AI message
      if (state.messages[state.messages.length - 1].role === 'user') {
        state.messages.push({ role: 'ai', content: action.payload });
      } else {
        // Append to existing AI message
        state.messages[state.messages.length - 1].content += action.payload;
      }
    },
    setStreamingStatus: (state, action) => {
      state.isStreaming = action.payload;
    },
    addSystemMessage: (state, action) => {
        state.messages.push({ role: 'system', content: action.payload });
    }
  },
});

export const { addUserMessage, addAIMessageChunk, setStreamingStatus, addSystemMessage } = chatSlice.actions;
export default chatSlice.reducer;
