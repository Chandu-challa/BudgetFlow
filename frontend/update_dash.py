import re

content = open('src/app/(dashboard)/dashboard/page.jsx', encoding='utf-8').read()

state_addition = """    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const fetchDashboardData = async () => {
        try {
            const params = {};
            if (startDate && endDate) {
                params.start_date = startDate;
                params.end_date = endDate;
            } else {
                params.month = month;
                params.year = year;
            }
            const response = await api.get("analytics/dashboard/", { params });
            setMetrics(response.data.metrics);
            setCharts(response.data.charts);
            setActivities(response.data.recent_activity);
            
            const insightsResponse = await api.get("analytics/smart-insights/", { params });
            setInsights(insightsResponse.data);
        }
        catch (error) {
            console.error("Error loading dashboard metrics", error);
        }
        finally {
            setLoading(false);
        }
    };
"""

fetch_dashboard_start = content.find('    const fetchDashboardData = async () => {')
fetch_dashboard_end = content.find('    useEffect(() => {', fetch_dashboard_start)
if fetch_dashboard_start != -1 and fetch_dashboard_end != -1:
    content = content[:fetch_dashboard_start] + state_addition + content[fetch_dashboard_end:]

use_effect_replacement = """    useEffect(() => {
        setLoading(true);
        fetchDashboardData();
    }, [month, year, startDate, endDate]);"""

content = re.sub(r'    useEffect\(\(\) => \{\s+fetchDashboardData\(\);\s+\}, \[\]\);', use_effect_replacement, content)

filters_ui = """        
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mt-4 md:mt-0">
          <div className="flex items-center gap-2 bg-secondary/50 p-1 rounded-xl border border-border">
            <select value={month} onChange={(e) => { setMonth(e.target.value); setStartDate(''); setEndDate(''); }} className="bg-card text-xs font-semibold px-2 py-1.5 rounded-lg border-none focus:ring-0 cursor-pointer text-foreground">
              {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'short' })}</option>
              ))}
            </select>
            <select value={year} onChange={(e) => { setYear(e.target.value); setStartDate(''); setEndDate(''); }} className="bg-card text-xs font-semibold px-2 py-1.5 rounded-lg border-none focus:ring-0 cursor-pointer text-foreground">
              {[...Array(5)].map((_, i) => {
                const y = new Date().getFullYear() - i;
                return <option key={y} value={y}>{y}</option>
              })}
            </select>
          </div>
          
          <div className="flex items-center gap-2 bg-secondary/50 p-1 rounded-xl border border-border">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-card text-xs font-semibold px-2 py-1 rounded-lg border-none focus:ring-0 cursor-pointer text-foreground" title="Start Date" />
            <span className="text-muted-foreground text-xs">to</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-card text-xs font-semibold px-2 py-1 rounded-lg border-none focus:ring-0 cursor-pointer text-foreground" title="End Date" />
          </div>
        </div>
      </motion.div>"""

content = content.replace('      </motion.div>', filters_ui, 1)

open('src/app/(dashboard)/dashboard/page.jsx', 'w', encoding='utf-8').write(content)
print('Dashboard page updated')
