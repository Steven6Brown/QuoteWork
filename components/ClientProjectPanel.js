export default function ClientProjectPanel({ clientName, setClientName, projectName, setProjectName }) {
  return (
    <div className="panel">
      <h2>Client &amp; Project</h2>
      <div className="field-row">
        <div>
          <label htmlFor="client-name">Client / Company Name</label>
          <input id="client-name" type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Riverside Dental" />
        </div>
        <div>
          <label htmlFor="project-name">Project Name</label>
          <input id="project-name" type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Website redesign" />
        </div>
      </div>
    </div>
  );
}
