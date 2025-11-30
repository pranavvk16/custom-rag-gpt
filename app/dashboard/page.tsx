interface Metrics {
    tierCounts: Record<number, number>
    deflectionRate: string
    totalTickets: number
}

async function Dashboard() {
    const res = await fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/metrics`, {
        cache: 'no-store'
    })
    const metrics: Metrics = await res.json()

    return (
        <div className="container mx-auto p-8 max-w-4xl">
            <h1 className="text-4xl font-bold mb-12">Analytics Dashboard</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-card p-8 rounded-xl shadow-lg">
                    <h2 className="text-2xl font-semibold mb-4 text-muted-foreground">Total Tickets</h2>
                    <p className="text-5xl font-black">{metrics.totalTickets}</p>
                </div>
                <div className="bg-card p-8 rounded-xl shadow-lg">
                    <h2 className="text-2xl font-semibold mb-4 text-muted-foreground">Deflection Rate</h2>
                    <p className="text-5xl font-black">{metrics.deflectionRate}%</p>
                </div>
                <div className="bg-card p-8 rounded-xl shadow-lg">
                    <h2 className="text-2xl font-semibold mb-4 text-muted-foreground">Tier Counts</h2>
                    <div className="space-y-2">
                        {Object.entries(metrics.tierCounts).map(([tier, count]) => (
                            <div key={tier} className="flex justify-between text-lg">
                                <span>Tier {tier}</span>
                                <span className="font-bold">{count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Dashboard