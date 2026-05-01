import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  hcp_name: '',
  interaction_date: '',
  attendees: '',
  topics_discussed: '',
  interaction_type: '',
  time: '',
  materials_shared: '',
  samples_distributed: '',
  sentiment: '',
  outcomes: '',
  follow_up_actions: '',
};

export const formSlice = createSlice({
  name: 'form',
  initialState,
  reducers: {
    updateFormState: (state, action) => {
      // Shallow merge the new fields into the existing state
      return { ...state, ...action.payload };
    },
    clearForm: () => initialState
  },
});

export const { updateFormState, clearForm } = formSlice.actions;
export default formSlice.reducer;
