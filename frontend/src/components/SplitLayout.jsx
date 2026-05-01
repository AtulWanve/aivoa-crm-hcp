import React from 'react';
import FormPanel from './FormPanel';
import ChatPanel from './ChatPanel';

const SplitLayout = () => {
  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* Left: Form Panel */}
      <div style={{ width: '50%', height: '100%', overflowY: 'auto', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        <FormPanel />
      </div>
      {/* Right: Chat Panel */}
      <div style={{ width: '50%', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <ChatPanel />
      </div>
    </div>
  );
};

export default SplitLayout;
