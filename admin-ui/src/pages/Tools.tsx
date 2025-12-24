import { useState, useEffect } from 'react';
import { Plus, Play, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { getTools, runTool, type Tool } from '../api';
import './CommonPages.css';

const Tools = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [testInput, setTestInput] = useState('{}');
  const [testOutput, setTestOutput] = useState('');
  const [running, setRunning] = useState(false);

  useEffect(() => {
    loadTools();
  }, []);

  const loadTools = async () => {
    const data = await getTools();
    setTools(data);
  };

  const handleRunTool = async () => {
    if (!selectedTool) return;
    setRunning(true);
    try {
      const input = JSON.parse(testInput);
      const output = await runTool(selectedTool.id, input);
      setTestOutput(JSON.stringify(output, null, 2));
    } catch (error: any) {
      setTestOutput(`Error: ${error.message}`);
    } finally {
      setRunning(false);
    }
  };

  const toggleTool = (id: string) => {
    setTools(tools.map(t => t.id === id ? { ...t, enabled: !t.enabled } : t));
  };

  return (
    <div className="common-page">
      <div className="page-header">
        <div>
          <h1>Tools Registry</h1>
          <p className="page-subtitle">Manage Ben's capabilities and tools</p>
        </div>
        <button className="btn-primary">
          <Plus size={18} />
          Add Tool
        </button>
      </div>

      <div className="two-column-layout">
        <div className="tools-list">
          <h3>Available Tools</h3>
          <div className="list-items">
            {tools.map((tool) => (
              <div
                key={tool.id}
                className={`list-item ${selectedTool?.id === tool.id ? 'active' : ''}`}
                onClick={() => setSelectedTool(tool)}
              >
                <div className="list-item-header">
                  <strong>{tool.name}</strong>
                  <button
                    className="icon-btn-small"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTool(tool.id);
                    }}
                  >
                    {tool.enabled ? <ToggleRight size={18} color="#22c55e" /> : <ToggleLeft size={18} />}
                  </button>
                </div>
                <p className="list-item-description">{tool.description}</p>
                <span className="list-item-meta">Connector: {tool.connectorName}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="tool-panel">
          {selectedTool ? (
            <>
              <div className="panel-header">
                <h3>{selectedTool.name}</h3>
                <button className="icon-btn">
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="panel-section">
                <h4>Description</h4>
                <p>{selectedTool.description}</p>
              </div>

              <div className="panel-section">
                <h4>Input Schema</h4>
                <pre className="code-block">{selectedTool.inputSchema}</pre>
              </div>

              <div className="panel-section">
                <h4>Output Schema</h4>
                <pre className="code-block">{selectedTool.outputSchema}</pre>
              </div>

              <div className="panel-section">
                <h4>Test Tool</h4>
                <label>Test Input (JSON)</label>
                <textarea
                  className="code-editor"
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  rows={5}
                />
                <button
                  className="btn-primary"
                  onClick={handleRunTool}
                  disabled={running}
                  style={{ marginTop: '8px' }}
                >
                  <Play size={16} />
                  {running ? 'Running...' : 'Run Tool'}
                </button>
                {testOutput && (
                  <>
                    <label style={{ marginTop: '16px' }}>Output</label>
                    <pre className="code-block">{testOutput}</pre>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <p>Select a tool to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Tools;
