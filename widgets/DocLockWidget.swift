import WidgetKit
import SwiftUI
import Intents

// Data Model to share with React Native
struct WidgetData: Decodable {
    let storageUsed: String
    let storageTotal: String
    let storagePercent: Double
    let cardsCount: Int
    let qrsCount: Int
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), data: WidgetData(storageUsed: "120 MB", storageTotal: "200 MB", storagePercent: 60, cardsCount: 3, qrsCount: 2))
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        let entry = SimpleEntry(date: Date(), data: loadData())
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        let entry = SimpleEntry(date: Date(), data: loadData())
        // Refresh every 15 minutes
        let nextUpdateDate = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdateDate))
        completion(timeline)
    }
    
    // Load data from App Group UserDefaults
    func loadData() -> WidgetData {
        let userDefaults = UserDefaults(suiteName: "group.com.techvriksha.doclock")
        if let savedData = userDefaults?.data(forKey: "dashboardStats"),
           let loadedStats = try? JSONDecoder().decode(WidgetData.self, from: savedData) {
            return loadedStats
        }
        return WidgetData(storageUsed: "0 MB", storageTotal: "200 MB", storagePercent: 0, cardsCount: 0, qrsCount: 0)
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let data: WidgetData
}

struct DocLockWidgetEntryView : View {
    var entry: Provider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        if family == .systemSmall {
            SmallWidgetView(data: entry.data)
        } else {
            MediumWidgetView(data: entry.data)
        }
    }
}

struct SmallWidgetView: View {
    let data: WidgetData
    
    var body: some View {
        VStack {
            ZStack {
                Circle()
                    .stroke(Color("WidgetBackground", bundle: nil).opacity(0.2), lineWidth: 8)
                Circle()
                    .trim(from: 0.0, to: CGFloat(data.storagePercent / 100))
                    .stroke(Color(hex: "1581BF"), style: StrokeStyle(lineWidth: 8, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                
                VStack {
                    Text("\(Int(data.storagePercent))%")
                        .font(.system(size: 20, weight: .bold, design: .rounded))
                        .foregroundColor(Color(hex: "1581BF"))
                    Text("USED")
                        .font(.system(size: 8, weight: .bold))
                        .foregroundColor(.gray)
                }
            }
            .padding(8)
            
            Text("Storage")
                .font(.caption)
                .bold()
                .foregroundColor(Color(hex: "1581BF"))
        }
        .padding()
        .background(Color.white)
    }
}

struct MediumWidgetView: View {
    let data: WidgetData
    
    var body: some View {
        HStack {
            // Left: Storage Ring
            SmallWidgetView(data: data)
                .frame(width: 140)
            
            Divider()
            
            // Right: Stats
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Image(systemName: "creditcard.fill")
                        .foregroundStyle(Color.pink)
                    Text("\(data.cardsCount) Cards")
                        .font(.subheadline)
                        .bold()
                }
                
                HStack {
                    Image(systemName: "qrcode")
                        .foregroundStyle(Color.orange)
                    Text("\(data.qrsCount) QRs")
                        .font(.subheadline)
                        .bold()
                }
                
                HStack {
                    Image(systemName: "lock.shield.fill")
                        .foregroundStyle(Color(hex: "1581BF"))
                    Text("Secure")
                        .font(.caption)
                        .foregroundColor(.gray)
                }
            }
            .padding()
        }
        .background(Color.white)
    }
}

@main
struct DocLockWidget: Widget {
    let kind: String = "DocLockWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            DocLockWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("DocLock Status")
        .description("View your storage and secure items.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// Helper for Hex Colors
extension Color {
    init(hex: String) {
        let scanner = Scanner(string: hex)
        var rgbValue: UInt64 = 0
        scanner.scanHexInt64(&rgbValue)
        
        let r = (rgbValue & 0xff0000) >> 16
        let g = (rgbValue & 0xff00) >> 8
        let b = rgbValue & 0xff
        
        self.init(
            .sRGB,
            red: Double(r) / 0xff,
            green: Double(g) / 0xff,
            blue: Double(b) / 0xff,
            opacity: 1
        )
    }
}
