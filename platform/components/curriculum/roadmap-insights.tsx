import {Lightbulb,CheckCircle2,Timer} from 'lucide-react';
import {lessons} from '@/lib/curriculum/learning';
export function RoadmapInsights({id,mobile=false}:{id:string;mobile?:boolean}){
 const guide=lessons[id];
 return <div className={mobile?'roadmap-mobile-insights':'insight-grid roadmap-insights'}><section className="insight-card"><div className="eyebrow"><Lightbulb size={15}/>THE IDEA</div><h2>Every move has a reason.</h2><p>{guide.idea}</p></section><section className="insight-card invariant"><div className="eyebrow mint"><CheckCircle2 size={15}/>WHY IT WORKS</div><h2>Reason about each step.</h2><p>{guide.why}</p></section><section className="complexity-card"><div className="eyebrow"><Timer size={15}/>TIME & MEMORY</div><p>{guide.cost}</p><small>Reference algorithm · excluding visualization snapshots and input/output conversion.</small></section></div>;
}
