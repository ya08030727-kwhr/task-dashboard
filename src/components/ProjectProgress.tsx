"use client";
import { useState } from "react";
import { Project } from "@/lib/types";

function Bar({ project, editable, onChange, onDelete, nm }: { project:Project; editable:boolean; onChange?:(id:number,v:number)=>void; onDelete?:(id:number)=>void; nm:boolean }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(project.progress.toString());
  const save = () => { onChange?.(project.id, Math.min(100,Math.max(0,parseInt(val)||0))); setEditing(false); };
  return (
    <div className="mb-4 relative group">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium" style={{ color:nm?"#E8E8F0":"#333" }}>{project.name}</span>
        <div className="flex items-center gap-2">
          {editable && editing
            ? <><input type="number" value={val} onChange={e=>setVal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&save()} min={0} max={100} autoFocus className="w-14 text-sm text-center px-1 py-0.5 rounded border" style={{ border:"1px solid #AFA9EC", background:nm?"#3A3A60":"white", color:nm?"#E8E8F0":"#333" }}/><span className="text-xs text-gray-400">%</span><button onClick={save} className="text-xs px-2 py-0.5 rounded text-white" style={{ background:"#7F77DD" }}>OK</button></>
            : <><span className="text-sm font-bold" style={{ color:project.color }}>{project.progress}%</span>{editable&&<button onClick={()=>{setVal(project.progress.toString());setEditing(true);}} className="text-xs text-gray-400 hover:text-gray-600">✏️</button>}</>
          }
        </div>
      </div>
      <div className="h-3 rounded-full overflow-hidden" style={{ background:nm?"#3A3A60":"#F0F0FF" }}>
        <div className="h-full rounded-full progress-bar" style={{ width:`${project.progress}%`, background:`linear-gradient(90deg,${project.color}88,${project.color})` }}/>
      </div>
      {editable && <button onClick={()=>onDelete?.(project.id)} className="absolute -top-1 right-0 text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100 text-xs">✕</button>}
    </div>
  );
}

export default function ProjectProgress({ projects, onProjectsChange, nightMode=false }: { projects:Project[]; onProjectsChange:(p:Project[])=>void; nightMode?:boolean }) {
  const [newName, setNewName] = useState("");
  const colors = ["#7F77DD","#D85A30","#1D9E75","#BA7517","#F0997B","#AFA9EC"];
  return (
    <div className="mb-5">
      <div className="rounded-2xl p-4 shadow-sm" style={{ background:nightMode?"#252540":"#FFF", border:`1px solid ${nightMode?"#3A3A60":"#F0EDFF"}` }}>
        <h2 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color:nightMode?"#AFA9EC":"#5A3A8A" }}><span>📊</span><span>案件進捗</span></h2>
        {projects.map(p=><Bar key={p.id} project={p} editable={nightMode} nm={nightMode} onChange={(id,v)=>onProjectsChange(projects.map(p=>p.id===id?{...p,progress:v}:p))} onDelete={id=>onProjectsChange(projects.filter(p=>p.id!==id))}/>)}
        {nightMode && <div className="flex gap-2 mt-3">
          <input type="text" value={newName} onChange={e=>setNewName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&newName.trim()&&(onProjectsChange([...projects,{id:Date.now(),name:newName.trim(),progress:0,color:colors[projects.length%colors.length]}]),setNewName(""))} placeholder="新しい案件名..." className="flex-1 text-sm px-3 py-2 rounded-xl border outline-none" style={{ border:"1px solid #3A3A60", background:"#3A3A60", color:"#E8E8F0" }}/>
          <button onClick={()=>newName.trim()&&(onProjectsChange([...projects,{id:Date.now(),name:newName.trim(),progress:0,color:colors[projects.length%colors.length]}]),setNewName(""))} className="px-3 py-2 rounded-xl text-sm font-bold text-white" style={{ background:"linear-gradient(135deg,#7F77DD,#5A52C8)" }}>追加</button>
        </div>}
      </div>
    </div>
  );
}
