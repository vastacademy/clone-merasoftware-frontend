// store/userSlice.js
import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  user: null,
  walletBalance: 0,
  initialized: false 
}

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserDetails: (state, action) => {
      console.log("📝 [userSlice] setUserDetails called with:", action.payload?.name || "NO NAME");
      state.user = action.payload
      state.walletBalance = action.payload?.walletBalance || 0
      state.initialized = true  // Set to true when user details are set
      console.log("📝 [userSlice] State updated - initialized set to true");
    },
    updateWalletBalance: (state, action) => {
      const nextBalance = Number(action.payload || 0);
      if (state.walletBalance === nextBalance) {
        return;
      }
      console.log("💰 [userSlice] updateWalletBalance called with:", nextBalance);
      state.walletBalance = nextBalance
    },
    logout: (state) => {
      console.log("🚪 [userSlice] logout called");
      state.user = null
      state.walletBalance = 0
      state.initialized = true  // Keep as true after logout since we know user state
      console.log("🚪 [userSlice] User cleared, initialized set to true");
    },
    // Add this new reducer
    initializeState: (state) => {
      state.initialized = true
    },
    updateUserRole: (state, action) => {
      if(state.user){
        state.user.role = action.payload
      }
    }
  }
})

export const { setUserDetails, updateWalletBalance, logout, initializeState, updateUserRole } = userSlice.actions
export default userSlice.reducer;
