export interface Entry { nickname: string; score: number; duration: number }
async function request<T>(path: string, body?: object): Promise<T> {
  const response = await fetch(`/api${path}`, {method:body ? 'POST':'GET',headers:body ? {'Content-Type':'application/json'}:undefined,body:body ? JSON.stringify(body):undefined,signal:AbortSignal.timeout(8000)});
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(typeof error?.detail === 'string' ? error.detail : 'Unable to save this score. Please try again.');
  }
  return response.json();
}
export const startRun = () => request<{id:string}>('/runs', {});
export const getLeaderboard = () => request<Entry[]>('/leaderboard');
export const saveScore = (id:string,nickname:string,score:number,duration:number) => request(`/runs/${id}/score`,{nickname,score,duration});
