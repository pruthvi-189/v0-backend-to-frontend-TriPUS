"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import {
  ShoppingCart,
  Package,
  TrendingUp,
  Download,
  Settings,
  Mail,
  BarChart3,
  PieChart,
  Activity,
  DollarSign,
  CreditCard,
} from "lucide-react"

interface Product {
  code: string
  name: string
  price: number
  stock: number
}

interface CartItem extends Product {
  quantity: number
}

interface CustomerFeedback {
  billId: string
  rating: number
  emoji: string
  comment?: string
  date: string
}

interface CreditCustomer {
  id: string
  name: string
  email: string
  phone?: string
  totalCredit: number
  lastPayment?: string
  createdDate: string
}

interface SalesAnalytics {
  totalSales: number
  totalRevenue: number
  averageOrderValue: number
  topSellingProducts: { name: string; quantity: number }[]
  salesTrend: { date: string; sales: number }[]
  lowStockAlerts: Product[]
  salesForecast: { date: string; predictedSales: number; confidence: number }[]
  revenueForecast: { period: string; predictedRevenue: number; growth: number }[]
  demandForecast: { productName: string; predictedDemand: number; recommendedStock: number }[]
  aiStockPrediction: {
    productName: string
    currentStock: number
    predictedNeed: number
    urgency: "low" | "medium" | "high"
  }[]
  aiSalesPrediction: { period: string; predictedSales: number; factors: string[] }[]
}

interface Bill {
  id: string
  date: string
  items: CartItem[]
  total: number
  paymentMethod: string
  customerName?: string
  customerEmail?: string
  emailSent?: boolean
  feedback?: CustomerFeedback
}

interface EmailSettings {
  apiKey: string
  senderEmail: string
  senderName: string
}

export default function RetailStore() {
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [bills, setBills] = useState<Bill[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isAddingProduct, setIsAddingProduct] = useState(false)
  const [productCode, setProductCode] = useState("")
  const [productName, setProductName] = useState("")
  const [productPrice, setProductPrice] = useState(0)
  const [productStock, setProductStock] = useState(0)
  const [productCodeEntry, setProductCodeEntry] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [customerName, setCustomerName] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [amountReceived, setAmountReceived] = useState(0)
  const [cardNumber, setCardNumber] = useState("")
  const [cardExpiry, setCardExpiry] = useState("")
  const [cardCVV, setCardCVV] = useState("")
  const [selectedBank, setSelectedBank] = useState("")
  const [emailSettings, setEmailSettings] = useState<EmailSettings>({ apiKey: "", senderEmail: "", senderName: "" })
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [currentBillForFeedback, setCurrentBillForFeedback] = useState<Bill | null>(null)
  const [feedbacks, setFeedbacks] = useState<CustomerFeedback[]>([])
  const [creditCustomers, setCreditCustomers] = useState<CreditCustomer[]>([])
  const [newCreditCustomer, setNewCreditCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    amount: 0,
  })
  const [isAddingCredit, setIsAddingCredit] = useState(false)
  const [salesAnalytics, setSalesAnalytics] = useState<SalesAnalytics>({
    totalSales: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    topSellingProducts: [],
    salesTrend: [],
    lowStockAlerts: [],
    salesForecast: [],
    revenueForecast: [],
    demandForecast: [],
    aiStockPrediction: [],
    aiSalesPrediction: [],
  })
  const [activeTab, setActiveTab] = useState<"dashboard" | "products" | "pos" | "payment" | "bills" | "analytics">(
    "pos",
  )

  const [isTestingApiKey, setIsTestingApiKey] = useState(false)
  const [apiKeyTestResult, setApiKeyTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const { toast } = useToast()

  const saveEmailSettingsToStorage = (settings: EmailSettings) => {
    try {
      localStorage.setItem("retail-store-email-settings", JSON.stringify(settings))
    } catch (error) {
      console.error("Failed to save email settings to localStorage:", error)
    }
  }

  const saveProductsToStorage = (productsData: Product[]) => {
    try {
      localStorage.setItem("retail-store-products", JSON.stringify(productsData))
    } catch (error) {
      console.error("Failed to save products to localStorage:", error)
    }
  }

  const saveBillsToStorage = (billsData: Bill[]) => {
    try {
      localStorage.setItem("retail-store-bills", JSON.stringify(billsData))
    } catch (error) {
      console.error("Failed to save bills to localStorage:", error)
    }
  }

  const saveFeedbacksToStorage = (feedbacksData: CustomerFeedback[]) => {
    try {
      localStorage.setItem("retail-store-feedbacks", JSON.stringify(feedbacksData))
    } catch (error) {
      console.error("Failed to save feedbacks to localStorage:", error)
    }
  }

  const addCreditCustomer = () => {
    if (!newCreditCustomer.name || !newCreditCustomer.email || newCreditCustomer.amount <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please fill all required fields with valid data",
        variant: "destructive",
      })
      return
    }

    const creditCustomer: CreditCustomer = {
      id: Date.now().toString(),
      name: newCreditCustomer.name,
      email: newCreditCustomer.email,
      phone: newCreditCustomer.phone,
      totalCredit: newCreditCustomer.amount,
      createdDate: new Date().toISOString(),
    }

    setCreditCustomers((prev) => [...prev, creditCustomer])
    setNewCreditCustomer({ name: "", email: "", phone: "", amount: 0 })
    setIsAddingCredit(false)

    toast({
      title: "Credit Customer Added",
      description: `${creditCustomer.name} added with ₹${creditCustomer.totalCredit} credit`,
    })
  }

  const sendCreditReminder = async (customer: CreditCustomer) => {
    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: customer.email,
          subject: "Payment Reminder - Outstanding Credit",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1f2937;">Payment Reminder</h2>
              <p>Dear ${customer.name},</p>
              <p>This is a friendly reminder that you have an outstanding credit balance of <strong>₹${customer.totalCredit}</strong>.</p>
              <p>Please make the payment at your earliest convenience.</p>
              <p>Thank you for your business!</p>
              <hr style="margin: 20px 0;">
              <p style="color: #6b7280; font-size: 12px;">
                ${emailSettings.senderName}<br>
                ${emailSettings.senderEmail}
              </p>
            </div>
          `,
          apiKey: emailSettings.apiKey,
          senderEmail: emailSettings.senderEmail,
          senderName: emailSettings.senderName,
        }),
      })

      if (response.ok) {
        toast({
          title: "Reminder Sent",
          description: `Payment reminder sent to ${customer.name}`,
        })
      } else {
        const error = await response.text()
        throw new Error(error)
      }
    } catch (error) {
      toast({
        title: "Failed to Send Reminder",
        description: "Please check your email settings and try again",
        variant: "destructive",
      })
    }
  }

  const calculateSalesAnalytics = (billsData: Bill[], productsData: Product[]) => {
    const totalSales = billsData.length
    const totalRevenue = billsData.reduce((sum, bill) => sum + bill.total, 0)
    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0

    // Calculate top selling products
    const productSales: { [key: string]: number } = {}
    billsData.forEach((bill) => {
      bill.items.forEach((item) => {
        productSales[item.name] = (productSales[item.name] || 0) + item.quantity
      })
    })

    const topSellingProducts = Object.entries(productSales)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)

    // Calculate sales trend (last 7 days)
    const salesTrend = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toDateString()
      const dailySales = billsData.filter((bill) => new Date(bill.date).toDateString() === dateStr).length
      salesTrend.push({ date: dateStr, sales: dailySales })
    }

    // Low stock alerts
    const lowStockAlerts = productsData.filter((product) => product.stock < 5)

    // Sales Forecasting - Simple linear regression based on historical trend
    const salesForecast = []
    if (salesTrend.length >= 3) {
      const recentTrend = salesTrend.slice(-3)
      const avgGrowth =
        recentTrend.reduce((sum, day, index) => {
          if (index === 0) return 0
          return sum + (day.sales - recentTrend[index - 1].sales)
        }, 0) /
        (recentTrend.length - 1)

      const lastSales = salesTrend[salesTrend.length - 1].sales

      for (let i = 1; i <= 7; i++) {
        const futureDate = new Date()
        futureDate.setDate(futureDate.getDate() + i)
        const predictedSales = Math.max(0, Math.round(lastSales + avgGrowth * i))
        const confidence = Math.max(60, 95 - i * 5) // Decreasing confidence over time

        salesForecast.push({
          date: futureDate.toDateString(),
          predictedSales,
          confidence,
        })
      }
    }

    // Revenue Forecasting - Based on sales forecast and average order value
    const revenueForecast = []
    if (salesForecast.length > 0 && averageOrderValue > 0) {
      const weeklyPredictedSales = salesForecast.reduce((sum, day) => sum + day.predictedSales, 0)
      const weeklyPredictedRevenue = weeklyPredictedSales * averageOrderValue
      const currentWeeklyRevenue = salesTrend.reduce((sum, day) => sum + day.sales, 0) * averageOrderValue
      const weeklyGrowth =
        currentWeeklyRevenue > 0 ? ((weeklyPredictedRevenue - currentWeeklyRevenue) / currentWeeklyRevenue) * 100 : 0

      revenueForecast.push(
        { period: "Next Week", predictedRevenue: weeklyPredictedRevenue, growth: weeklyGrowth },
        { period: "Next Month", predictedRevenue: weeklyPredictedRevenue * 4.3, growth: weeklyGrowth * 0.8 },
        { period: "Next Quarter", predictedRevenue: weeklyPredictedRevenue * 13, growth: weeklyGrowth * 0.6 },
      )
    }

    // Demand Forecasting - Predict future demand for each product
    const demandForecast = []
    topSellingProducts.forEach((product) => {
      const productBills = billsData.filter((bill) => bill.items.some((item) => item.name === product.name))

      if (productBills.length >= 2) {
        // Calculate average daily demand
        const totalDays = 7 // Last 7 days
        const dailyDemand = product.quantity / totalDays

        // Predict next week's demand with seasonal adjustment
        const seasonalMultiplier = 1.1 // Assume 10% growth
        const predictedWeeklyDemand = Math.round(dailyDemand * 7 * seasonalMultiplier)

        // Calculate recommended stock (demand + safety stock)
        const safetyStock = Math.ceil(predictedWeeklyDemand * 0.3) // 30% safety stock
        const recommendedStock = predictedWeeklyDemand + safetyStock

        demandForecast.push({
          productName: product.name,
          predictedDemand: predictedWeeklyDemand,
          recommendedStock,
        })
      }
    })

    return {
      totalSales,
      totalRevenue,
      averageOrderValue,
      topSellingProducts,
      salesTrend,
      lowStockAlerts,
      salesForecast,
      revenueForecast,
      demandForecast,
    }
  }

  const loadDataFromStorage = () => {
    try {
      const savedProducts = localStorage.getItem("retail-store-products")
      const savedBills = localStorage.getItem("retail-store-bills")
      const savedEmailSettings = localStorage.getItem("retail-store-email-settings")
      const savedFeedbacks = localStorage.getItem("retail-store-feedbacks")

      let loadedProducts = []
      let loadedBills = []

      if (savedProducts) {
        loadedProducts = JSON.parse(savedProducts)
        setProducts(loadedProducts)
      } else {
        const defaultProducts = [
          { code: "P001", name: "Laptop", price: 50000, stock: 10 },
          { code: "P002", name: "Mouse", price: 500, stock: 25 },
          { code: "P003", name: "Keyboard", price: 1500, stock: 15 },
        ]
        setProducts(defaultProducts)
        saveProductsToStorage(defaultProducts)
        loadedProducts = defaultProducts
      }

      if (savedBills) {
        loadedBills = JSON.parse(savedBills)
        setBills(loadedBills)
      }

      if (savedFeedbacks) {
        setFeedbacks(JSON.parse(savedFeedbacks))
      }

      if (savedEmailSettings) {
        setEmailSettings(JSON.parse(savedEmailSettings))
      }

      const analytics = calculateSalesAnalytics(loadedBills, loadedProducts)
      setSalesAnalytics(analytics)
    } catch (error) {
      console.error("Failed to load data from localStorage:", error)
    }
  }

  useEffect(() => {
    loadDataFromStorage()
  }, [])

  const calculateAnalytics = useCallback(() => {
    const totalSales = bills.length
    const totalRevenue = bills.reduce((sum, bill) => sum + bill.total, 0)
    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0

    // Calculate top selling products
    const productSales: { [key: string]: number } = {}
    bills.forEach((bill) => {
      bill.items.forEach((item) => {
        productSales[item.name] = (productSales[item.name] || 0) + item.quantity
      })
    })

    const topSellingProducts = Object.entries(productSales)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)

    // Calculate sales trend (last 7 days)
    const salesTrend = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toDateString()
      const dailySales = bills.filter((bill) => new Date(bill.date).toDateString() === dateStr).length
      salesTrend.push({ date: dateStr, sales: dailySales })
    }

    // Low stock alerts
    const lowStockAlerts = products.filter((product) => product.stock < 5)

    // Sales Forecasting - Simple linear regression based on historical trend
    const salesForecast = []
    if (salesTrend.length >= 3) {
      const recentTrend = salesTrend.slice(-3)
      const avgGrowth =
        recentTrend.reduce((sum, day, index) => {
          if (index === 0) return 0
          return sum + (day.sales - recentTrend[index - 1].sales)
        }, 0) /
        (recentTrend.length - 1)

      const lastSales = salesTrend[salesTrend.length - 1].sales

      for (let i = 1; i <= 7; i++) {
        const futureDate = new Date()
        futureDate.setDate(futureDate.getDate() + i)
        const predictedSales = Math.max(0, Math.round(lastSales + avgGrowth * i))
        const confidence = Math.max(60, 95 - i * 5) // Decreasing confidence over time

        salesForecast.push({
          date: futureDate.toDateString(),
          predictedSales,
          confidence,
        })
      }
    }

    // Revenue Forecasting - Based on sales forecast and average order value
    const revenueForecast = []
    if (salesForecast.length > 0 && averageOrderValue > 0) {
      const weeklyPredictedSales = salesForecast.reduce((sum, day) => sum + day.predictedSales, 0)
      const weeklyPredictedRevenue = weeklyPredictedSales * averageOrderValue
      const currentWeeklyRevenue = salesTrend.reduce((sum, day) => sum + day.sales, 0) * averageOrderValue
      const weeklyGrowth =
        currentWeeklyRevenue > 0 ? ((weeklyPredictedRevenue - currentWeeklyRevenue) / currentWeeklyRevenue) * 100 : 0

      revenueForecast.push(
        { period: "Next Week", predictedRevenue: weeklyPredictedRevenue, growth: weeklyGrowth },
        { period: "Next Month", predictedRevenue: weeklyPredictedRevenue * 4.3, growth: weeklyGrowth * 0.8 },
        { period: "Next Quarter", predictedRevenue: weeklyPredictedRevenue * 13, growth: weeklyGrowth * 0.6 },
      )
    }

    // Demand Forecasting - Predict future demand for each product
    const demandForecast = []
    topSellingProducts.forEach((product) => {
      const productBills = bills.filter((bill) => bill.items.some((item) => item.name === product.name))

      if (productBills.length >= 2) {
        // Calculate average daily demand
        const totalDays = 7 // Last 7 days
        const dailyDemand = product.quantity / totalDays

        // Predict next week's demand with seasonal adjustment
        const seasonalMultiplier = 1.1 // Assume 10% growth
        const predictedWeeklyDemand = Math.round(dailyDemand * 7 * seasonalMultiplier)

        // Calculate recommended stock (demand + safety stock)
        const safetyStock = Math.ceil(predictedWeeklyDemand * 0.3) // 30% safety stock
        const recommendedStock = predictedWeeklyDemand + safetyStock

        demandForecast.push({
          productName: product.name,
          predictedDemand: predictedWeeklyDemand,
          recommendedStock,
        })
      }
    })

    const aiStockPrediction = products.map((product) => {
      const salesHistory = bills.flatMap((bill) => bill.items.filter((item) => item.name === product.name))
      const totalSold = salesHistory.reduce((sum, item) => sum + item.quantity, 0)
      const avgSalesPerWeek = totalSold / Math.max(1, Math.ceil(bills.length / 7))
      const predictedNeed = Math.ceil(avgSalesPerWeek * 2) // 2 weeks prediction

      let urgency: "low" | "medium" | "high" = "low"
      if (product.stock < predictedNeed * 0.5) urgency = "high"
      else if (product.stock < predictedNeed) urgency = "medium"

      return {
        productName: product.name,
        currentStock: product.stock,
        predictedNeed,
        urgency,
      }
    })

    const aiSalesPrediction = [
      {
        period: "Next Week",
        predictedSales: Math.ceil(totalSales * 1.1 + Math.random() * 5),
        factors: ["Historical trend", "Seasonal patterns", "Market conditions"],
      },
      {
        period: "Next Month",
        predictedSales: Math.ceil(totalSales * 4.2 + Math.random() * 15),
        factors: ["Growth trajectory", "Customer retention", "Product popularity"],
      },
    ]

    setSalesAnalytics({
      totalSales,
      totalRevenue,
      averageOrderValue,
      topSellingProducts,
      salesTrend,
      lowStockAlerts,
      salesForecast,
      revenueForecast,
      demandForecast,
      aiStockPrediction,
      aiSalesPrediction,
    })
  }, [bills, products, feedbacks])

  useEffect(() => {
    const analytics = calculateSalesAnalytics(bills, products)
    setSalesAnalytics(analytics)
  }, [bills, products])

  useEffect(() => {
    if (products.length > 0) {
      saveProductsToStorage(products)
    }
  }, [products])

  useEffect(() => {
    if (bills.length > 0) {
      saveBillsToStorage(bills)
    }
  }, [bills])

  useEffect(() => {
    if (feedbacks.length > 0) {
      saveFeedbacksToStorage(feedbacks)
    }
  }, [feedbacks])

  useEffect(() => {
    if (emailSettings.apiKey || emailSettings.senderEmail) {
      saveEmailSettingsToStorage(emailSettings)
    }
  }, [emailSettings])

  const testApiKey = async () => {
    if (!emailSettings.apiKey || !emailSettings.senderEmail) {
      setApiKeyTestResult({
        success: false,
        message: "Please enter both API key and sender email",
      })
      return
    }

    setIsTestingApiKey(true)
    setApiKeyTestResult(null)

    try {
      const response = await fetch("/api/test-sendgrid", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiKey: emailSettings.apiKey,
          senderEmail: emailSettings.senderEmail,
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setApiKeyTestResult({
          success: true,
          message: "API key is valid and sender email is verified!",
        })
      } else {
        setApiKeyTestResult({
          success: false,
          message: result.error || "API key test failed",
        })
      }
    } catch (error) {
      setApiKeyTestResult({
        success: false,
        message: "Failed to test API key. Please check your connection.",
      })
    } finally {
      setIsTestingApiKey(false)
    }
  }

  const sendEmailReceipt = async (bill: Bill, customerEmail: string) => {
    if (!emailSettings.apiKey || !emailSettings.senderEmail) {
      toast({
        title: "Email Configuration Missing",
        description: "Please configure email settings to send receipts",
        variant: "default",
      })
      return false
    }

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bill,
          customerEmail,
          emailSettings,
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast({
          title: "Email Sent",
          description: `Receipt sent to ${customerEmail}`,
        })
        return true
      } else {
        let errorTitle = "Email Failed"
        let errorDescription = result.error || "Failed to send email"

        if (response.status === 401) {
          errorTitle = "Invalid API Key"
          errorDescription = "Please check your SendGrid API key in settings"
        } else if (response.status === 403) {
          errorTitle = "Sender Not Verified"
          errorDescription = "Please verify your sender email in SendGrid"
        }

        toast({
          title: errorTitle,
          description: `${errorDescription}. Payment completed successfully.`,
          variant: "default",
        })

        return false
      }
    } catch (error) {
      console.error("Email sending error:", error)
      toast({
        title: "Email Failed",
        description: "Payment completed successfully. Email could not be sent.",
        variant: "default",
      })
      return false
    }
  }

  const exportSalesData = () => {
    const csvContent = [
      ["Bill ID", "Date", "Customer", "Items", "Total", "Payment Method", "Email Sent", "Feedback Rating"].join(","),
      ...bills.map((bill) =>
        [
          bill.id,
          bill.date,
          bill.customerName || "Walk-in Customer",
          bill.items.map((item) => `${item.name} (${item.quantity})`).join("; "),
          bill.total.toFixed(2),
          bill.paymentMethod,
          bill.emailSent ? "Yes" : "No",
          bill.feedback?.rating || "N/A",
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `sales-data-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)

    toast({
      title: "Export Successful",
      description: "Sales data exported to CSV file",
    })
  }

  const submitFeedback = (rating: number, emoji: string, comment?: string) => {
    if (!currentBillForFeedback) return

    const feedback: CustomerFeedback = {
      billId: currentBillForFeedback.id,
      rating,
      emoji,
      comment,
      date: new Date().toISOString(),
    }

    const updatedBills = bills.map((bill) => (bill.id === currentBillForFeedback.id ? { ...bill, feedback } : bill))

    setBills(updatedBills)
    setFeedbacks([...feedbacks, feedback])
    setShowFeedbackModal(false)
    setCurrentBillForFeedback(null)

    toast({
      title: "Thank You!",
      description: "Your feedback has been recorded",
    })
  }

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const addProduct = () => {
    if (!productCode || !productName || productPrice <= 0 || productStock < 0) {
      toast({
        title: "Invalid Product Data",
        description: "Please fill all fields with valid data",
        variant: "destructive",
      })
      return
    }

    if (products.some((p) => p.code === productCode)) {
      toast({
        title: "Product Code Exists",
        description: "A product with this code already exists",
        variant: "destructive",
      })
      return
    }

    const newProduct: Product = {
      code: productCode,
      name: productName,
      price: productPrice,
      stock: productStock,
    }

    setProducts([...products, newProduct])
    setProductCode("")
    setProductName("")
    setProductPrice(0)
    setProductStock(0)
    setIsAddingProduct(false)

    toast({
      title: "Product Added",
      description: `${productName} has been added successfully`,
    })
  }

  const updateProduct = () => {
    if (!editingProduct || !productName || productPrice <= 0 || productStock < 0) {
      toast({
        title: "Invalid Product Data",
        description: "Please fill all fields with valid data",
        variant: "destructive",
      })
      return
    }

    const updatedProducts = products.map((product) =>
      product.code === editingProduct.code
        ? { ...product, name: productName, price: productPrice, stock: productStock }
        : product,
    )

    setProducts(updatedProducts)
    setEditingProduct(null)
    setProductName("")
    setProductPrice(0)
    setProductStock(0)

    toast({
      title: "Product Updated",
      description: `${productName} has been updated successfully`,
    })
  }

  const deleteProduct = (code: string) => {
    setProducts(products.filter((product) => product.code !== code))
    toast({
      title: "Product Deleted",
      description: "Product has been removed from inventory",
    })
  }

  const addToCartByCode = () => {
    if (!productCodeEntry) return

    const product = products.find((p) => p.code.toLowerCase() === productCodeEntry.toLowerCase())
    if (!product) {
      toast({
        title: "Product Not Found",
        description: "No product found with this code",
        variant: "destructive",
      })
      return
    }

    if (product.stock < quantity) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${product.stock} items available`,
        variant: "destructive",
      })
      return
    }

    addToCart(product)
    setProductCodeEntry("")
    setQuantity(1)
  }

  const addToCart = (product: Product) => {
    if (product.stock < quantity) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${product.stock} items available`,
        variant: "destructive",
      })
      return
    }

    const existingItem = cart.find((item) => item.code === product.code)
    if (existingItem) {
      if (existingItem.quantity + quantity > product.stock) {
        toast({
          title: "Insufficient Stock",
          description: `Only ${product.stock} items available`,
          variant: "destructive",
        })
        return
      }
      setCart(cart.map((item) => (item.code === product.code ? { ...item, quantity: item.quantity + quantity } : item)))
    } else {
      setCart([...cart, { ...product, quantity }])
    }

    toast({
      title: "Added to Cart",
      description: `${quantity} ${product.name}(s) added to cart`,
    })
  }

  const removeFromCart = (code: string) => {
    setCart(cart.filter((item) => item.code !== code))
  }

  const updateCartQuantity = (code: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(code)
      return
    }

    const product = products.find((p) => p.code === code)
    if (product && newQuantity > product.stock) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${product.stock} items available`,
        variant: "destructive",
      })
      return
    }

    setCart(cart.map((item) => (item.code === code ? { ...item, quantity: newQuantity } : item)))
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const gst = total * 0.18
  const finalTotal = total + gst

  const processPayment = async (paymentMethod: string) => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to cart before payment",
        variant: "destructive",
      })
      return
    }

    if (paymentMethod === "cash" && amountReceived < finalTotal) {
      toast({
        title: "Insufficient Amount",
        description: "Amount received is less than total",
        variant: "destructive",
      })
      return
    }

    if (paymentMethod === "card" && (!cardNumber || !cardExpiry || !cardCVV)) {
      toast({
        title: "Card Details Required",
        description: "Please fill all card details",
        variant: "destructive",
      })
      return
    }

    if (paymentMethod === "netbanking" && !selectedBank) {
      toast({
        title: "Bank Selection Required",
        description: "Please select a bank",
        variant: "destructive",
      })
      return
    }

    const newBill: Bill = {
      id: `BILL-${Date.now()}`,
      date: new Date().toLocaleString(),
      items: [...cart],
      total: finalTotal,
      paymentMethod,
      customerName: customerName || "Walk-in Customer",
      customerEmail: customerEmail || undefined,
      emailSent: false,
    }

    if (customerEmail && customerEmail.includes("@")) {
      const emailSent = await sendEmailReceipt(newBill, customerEmail)
      newBill.emailSent = emailSent
    }

    setBills((prev) => [...prev, newBill])

    // Update stock
    cart.forEach((item) => {
      setProducts((prev) => prev.map((p) => (p.code === item.code ? { ...p, stock: p.stock - item.quantity } : p)))
    })

    // Clear cart and reset form
    setCart([])
    setCustomerName("")
    setCustomerEmail("")
    setAmountReceived(0)
    setCardNumber("")
    setCardExpiry("")
    setCardCVV("")
    setSelectedBank("")
    setActiveTab("pos")

    toast({
      title: "Payment Successful",
      description: `Bill ${newBill.id} created successfully${newBill.emailSent ? " and receipt sent" : ""}`,
    })
  }

  const generateUPIQR = (amount: number) => {
    const upiString = `upi://pay?pa=pruthvinarayanareddy@okicici&pn=Retail Store&am=${amount}&cu=INR&tn=Payment for Bill`
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiString)}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-4 rounded-2xl shadow-lg">
              <ShoppingCart className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                RetailPro Management
              </h1>
              <p className="text-gray-600 text-lg">AI-Powered Point of Sale System</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={exportSalesData}
              variant="outline"
              className="gap-2 bg-white/50 backdrop-blur-sm border-white/30 hover:bg-white/70"
            >
              <Download className="h-4 w-4" />
              Export Data
            </Button>
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-2 bg-white/50 backdrop-blur-sm border-white/30 hover:bg-white/70"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Email Settings</DialogTitle>
                  <DialogDescription>
                    Configure SendGrid email settings for receipts
                    <div className="mt-2 p-3 bg-blue-50 rounded-md text-sm">
                      <strong>Setup Instructions:</strong>
                      <ol className="list-decimal list-inside mt-1 space-y-1">
                        <li>Create a SendGrid account at sendgrid.com</li>
                        <li>Go to Settings → API Keys → Create API Key</li>
                        <li>Choose "Restricted Access" and enable "Mail Send" permission</li>
                        <li>Copy the API key (starts with "SG.")</li>
                        <li>Verify your sender email in SendGrid (Settings → Sender Authentication)</li>
                      </ol>
                    </div>
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="api-key" className="text-right">
                      API Key
                    </Label>
                    <Input
                      id="api-key"
                      value={emailSettings.apiKey}
                      onChange={(e) => setEmailSettings({ ...emailSettings, apiKey: e.target.value })}
                      className="col-span-3"
                      placeholder="SG...."
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="sender-email" className="text-right">
                      Sender Email
                    </Label>
                    <Input
                      id="sender-email"
                      type="email"
                      value={emailSettings.senderEmail}
                      onChange={(e) => setEmailSettings({ ...emailSettings, senderEmail: e.target.value })}
                      className="col-span-3"
                      placeholder="your-verified-email@domain.com"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="sender-name" className="text-right">
                      Sender Name
                    </Label>
                    <Input
                      id="sender-name"
                      value={emailSettings.senderName}
                      onChange={(e) => setEmailSettings({ ...emailSettings, senderName: e.target.value })}
                      className="col-span-3"
                      placeholder="Retail Store"
                    />
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <div className="text-right">
                      <Button
                        onClick={testApiKey}
                        disabled={isTestingApiKey || !emailSettings.apiKey || !emailSettings.senderEmail}
                        variant="outline"
                        size="sm"
                      >
                        {isTestingApiKey ? "Testing..." : "Test API Key"}
                      </Button>
                    </div>
                    <div className="col-span-3">
                      {apiKeyTestResult && (
                        <div
                          className={`p-2 rounded text-sm ${
                            apiKeyTestResult.success
                              ? "bg-green-50 text-green-700 border border-green-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}
                        >
                          {apiKeyTestResult.message}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => setIsSettingsOpen(false)}>Save Settings</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 bg-white/80 backdrop-blur-sm shadow-lg border border-white/20 rounded-2xl p-2">
            <TabsTrigger
              value="dashboard"
              className="gap-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white"
            >
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger
              value="products"
              className="gap-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white"
            >
              <Package className="h-4 w-4" />
              Products
            </TabsTrigger>
            <TabsTrigger
              value="pos"
              className="gap-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white"
            >
              <ShoppingCart className="h-4 w-4" />
              Point of Sale
            </TabsTrigger>
            <TabsTrigger
              value="payment"
              className="gap-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white"
            >
              <DollarSign className="h-4 w-4" />
              Payment
            </TabsTrigger>
            <TabsTrigger
              value="bills"
              className="gap-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white"
            >
              <Activity className="h-4 w-4" />
              Bills
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="gap-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white"
            >
              <TrendingUp className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger
              value="credit"
              className="gap-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white"
            >
              <CreditCard className="h-4 w-4" />
              Credit
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                  <TrendingUp className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{salesAnalytics.totalSales}</div>
                  <p className="text-xs opacity-80">Total transactions</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{salesAnalytics.totalRevenue.toFixed(2)}</div>
                  <p className="text-xs opacity-80">Total earnings</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Order</CardTitle>
                  <Activity className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{salesAnalytics.averageOrderValue.toFixed(2)}</div>
                  <p className="text-xs opacity-80">Per transaction</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
                  <Package className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{salesAnalytics.lowStockAlerts.length}</div>
                  <p className="text-xs opacity-80">Need restocking</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Top Selling Products
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {salesAnalytics.topSellingProducts.map((product, index) => (
                      <div key={product.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <span className="font-medium">{product.name}</span>
                        </div>
                        <Badge variant="secondary">{product.quantity} sold</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Low Stock Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {salesAnalytics.lowStockAlerts.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">All products are well stocked!</p>
                    ) : (
                      salesAnalytics.lowStockAlerts.map((product) => (
                        <div key={product.code} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-gray-600">Code: {product.code}</p>
                          </div>
                          <Badge variant="destructive">{product.stock} left</Badge>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Product Management
                    </CardTitle>
                    <CardDescription>Manage your inventory and product catalog</CardDescription>
                  </div>
                  <Dialog open={isAddingProduct} onOpenChange={setIsAddingProduct}>
                    <DialogTrigger asChild>
                      <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                        Add Product
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Product</DialogTitle>
                        <DialogDescription>Enter product details to add to inventory</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="code" className="text-right">
                            Code
                          </Label>
                          <Input
                            id="code"
                            value={productCode}
                            onChange={(e) => setProductCode(e.target.value)}
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="name" className="text-right">
                            Name
                          </Label>
                          <Input
                            id="name"
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="price" className="text-right">
                            Price
                          </Label>
                          <Input
                            id="price"
                            type="number"
                            value={productPrice}
                            onChange={(e) => setProductPrice(Number.parseFloat(e.target.value) || 0)}
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="stock" className="text-right">
                            Stock
                          </Label>
                          <Input
                            id="stock"
                            type="number"
                            value={productStock}
                            onChange={(e) => setProductStock(Number.parseInt(e.target.value) || 0)}
                            className="col-span-3"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={addProduct}>Add Product</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Input
                    placeholder="Search products by name or code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <div className="grid gap-4">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.code}
                      className="flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <div className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm font-medium">
                            {product.code}
                          </div>
                          <div>
                            <h3 className="font-semibold">{product.name}</h3>
                            <p className="text-gray-600">₹{product.price.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={product.stock < 5 ? "destructive" : "secondary"}>Stock: {product.stock}</Badge>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingProduct(product)
                                  setProductName(product.name)
                                  setProductPrice(product.price)
                                  setProductStock(product.stock)
                                }}
                              >
                                Edit
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Product</DialogTitle>
                                <DialogDescription>Update product details</DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="edit-name" className="text-right">
                                    Name
                                  </Label>
                                  <Input
                                    id="edit-name"
                                    value={productName}
                                    onChange={(e) => setProductName(e.target.value)}
                                    className="col-span-3"
                                  />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="edit-price" className="text-right">
                                    Price
                                  </Label>
                                  <Input
                                    id="edit-price"
                                    type="number"
                                    value={productPrice}
                                    onChange={(e) => setProductPrice(Number.parseFloat(e.target.value) || 0)}
                                    className="col-span-3"
                                  />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="edit-stock" className="text-right">
                                    Stock
                                  </Label>
                                  <Input
                                    id="edit-stock"
                                    type="number"
                                    value={productStock}
                                    onChange={(e) => setProductStock(Number.parseInt(e.target.value) || 0)}
                                    className="col-span-3"
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button onClick={updateProduct}>Update Product</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Product</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete {product.name}? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteProduct(product.code)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pos" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Add Items to Cart
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter product code..."
                      value={productCodeEntry}
                      onChange={(e) => setProductCodeEntry(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addToCartByCode()}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Number.parseInt(e.target.value) || 1)}
                      className="w-20"
                    />
                    <Button onClick={addToCartByCode} className="bg-gradient-to-r from-green-600 to-green-700">
                      Add
                    </Button>
                  </div>
                  <Separator />
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {products.map((product) => (
                      <div
                        key={product.code}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-gray-600">
                            ₹{product.price} • Stock: {product.stock}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => addToCart(product)}
                          disabled={product.stock === 0}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600"
                        >
                          Add
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Shopping Cart
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {cart.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">Cart is empty</p>
                  ) : (
                    <div className="space-y-4">
                      {cart.map((item) => (
                        <div key={item.code} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-gray-600">₹{item.price} each</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateCartQuantity(item.code, item.quantity - 1)}
                            >
                              -
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateCartQuantity(item.code, item.quantity + 1)}
                            >
                              +
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => removeFromCart(item.code)}>
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Separator />
                      <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span>₹{total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>GST (18%):</span>
                          <span>₹{gst.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg">
                          <span>Total:</span>
                          <span>₹{finalTotal.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="payment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Payment Processing
                </CardTitle>
                <CardDescription>Process customer payment and generate receipt</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customer-name">Customer Name</Label>
                    <Input
                      id="customer-name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Enter customer name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer-email">Customer Email (for receipt)</Label>
                    <Input
                      id="customer-email"
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="customer@example.com"
                    />
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Order Summary</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₹{total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST (18%):</span>
                      <span>₹{gst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total Amount:</span>
                      <span>₹{finalTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <Tabs defaultValue="cash" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="cash">Cash</TabsTrigger>
                    <TabsTrigger value="card">Card</TabsTrigger>
                    <TabsTrigger value="netbanking">Net Banking</TabsTrigger>
                    <TabsTrigger value="upi">UPI</TabsTrigger>
                  </TabsList>

                  <TabsContent value="cash" className="space-y-4">
                    <div>
                      <Label htmlFor="amount-received">Amount Received</Label>
                      <Input
                        id="amount-received"
                        type="number"
                        value={amountReceived}
                        onChange={(e) => setAmountReceived(Number.parseFloat(e.target.value) || 0)}
                        placeholder="Enter amount received"
                      />
                    </div>
                    {amountReceived > 0 && (
                      <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-green-800">
                          Change to return: ₹{Math.max(0, amountReceived - finalTotal).toFixed(2)}
                        </p>
                      </div>
                    )}
                    <Button
                      onClick={() => processPayment("cash")}
                      disabled={cart.length === 0}
                      className="w-full bg-gradient-to-r from-green-600 to-green-700"
                    >
                      Process Cash Payment
                    </Button>
                  </TabsContent>

                  <TabsContent value="card" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="card-number">Card Number</Label>
                        <Input
                          id="card-number"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          placeholder="1234 5678 9012 3456"
                        />
                      </div>
                      <div>
                        <Label htmlFor="card-expiry">Expiry Date</Label>
                        <Input
                          id="card-expiry"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="MM/YY"
                        />
                      </div>
                      <div>
                        <Label htmlFor="card-cvv">CVV</Label>
                        <Input
                          id="card-cvv"
                          value={cardCVV}
                          onChange={(e) => setCardCVV(e.target.value)}
                          placeholder="123"
                        />
                      </div>
                    </div>
                    <Button
                      onClick={() => processPayment("card")}
                      disabled={cart.length === 0}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600"
                    >
                      Process Card Payment
                    </Button>
                  </TabsContent>

                  <TabsContent value="netbanking" className="space-y-4">
                    <div>
                      <Label htmlFor="bank-select">Select Bank</Label>
                      <Select value={selectedBank} onValueChange={setSelectedBank}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose your bank" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sbi">State Bank of India</SelectItem>
                          <SelectItem value="hdfc">HDFC Bank</SelectItem>
                          <SelectItem value="icici">ICICI Bank</SelectItem>
                          <SelectItem value="axis">Axis Bank</SelectItem>
                          <SelectItem value="pnb">Punjab National Bank</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={() => processPayment("netbanking")}
                      disabled={cart.length === 0}
                      className="w-full bg-gradient-to-r from-purple-600 to-purple-700"
                    >
                      Process Net Banking Payment
                    </Button>
                  </TabsContent>

                  <TabsContent value="upi" className="space-y-4">
                    <div className="text-center">
                      <p className="mb-4">Scan QR code to pay ₹{finalTotal.toFixed(2)}</p>
                      <div className="flex justify-center">
                        <img
                          src={generateUPIQR(finalTotal) || "/placeholder.svg"}
                          alt="UPI QR Code"
                          className="border rounded-lg shadow-md"
                        />
                      </div>
                      <p className="text-sm text-gray-600 mt-2">UPI ID: pruthvinarayanareddy@okicici</p>
                    </div>
                    <Button
                      onClick={() => processPayment("upi")}
                      disabled={cart.length === 0}
                      className="w-full bg-gradient-to-r from-orange-600 to-orange-700"
                    >
                      Confirm UPI Payment
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bills" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Transaction History
                </CardTitle>
                <CardDescription>View all completed transactions and receipts</CardDescription>
              </CardHeader>
              <CardContent>
                {bills.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No transactions yet</p>
                ) : (
                  <div className="space-y-4">
                    {bills.map((bill) => (
                      <div key={bill.id} className="border rounded-lg p-4 bg-white shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-semibold">{bill.id}</h3>
                            <p className="text-sm text-gray-600">{bill.date}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">₹{bill.total.toFixed(2)}</p>
                            <Badge variant="outline">{bill.paymentMethod.toUpperCase()}</Badge>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm">Customer: {bill.customerName}</p>
                            <p className="text-sm">Items: {bill.items.length}</p>
                            {bill.feedback && (
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-lg">{bill.feedback.emoji}</span>
                                <span className="text-sm text-gray-600">Rating: {bill.feedback.rating}/5</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {bill.emailSent && (
                              <Badge variant="secondary" className="gap-1">
                                <Mail className="h-3 w-3" />
                                Email Sent
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <Card className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4" />
                    Sales Forecast (Next Week)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {salesAnalytics.salesForecast.length > 0
                      ? salesAnalytics.salesForecast.reduce((sum, day) => sum + day.predictedSales, 0)
                      : "N/A"}
                  </div>
                  <p className="text-xs opacity-80">Predicted transactions</p>
                  {salesAnalytics.salesForecast.length > 0 && (
                    <p className="text-xs opacity-90 mt-1">
                      Avg confidence:{" "}
                      {Math.round(
                        salesAnalytics.salesForecast.reduce((sum, day) => sum + day.confidence, 0) /
                          salesAnalytics.salesForecast.length,
                      )}
                      %
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-emerald-500 to-green-600 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4" />
                    Revenue Forecast
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ₹
                    {salesAnalytics.revenueForecast.length > 0
                      ? salesAnalytics.revenueForecast[0].predictedRevenue.toFixed(0)
                      : "0"}
                  </div>
                  <p className="text-xs opacity-80">Next week projection</p>
                  {salesAnalytics.revenueForecast.length > 0 && (
                    <p className="text-xs opacity-90 mt-1">
                      {salesAnalytics.revenueForecast[0].growth >= 0 ? "+" : ""}
                      {salesAnalytics.revenueForecast[0].growth.toFixed(1)}% growth
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-violet-500 to-purple-600 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4" />
                    Inventory Optimization
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{salesAnalytics.demandForecast.length}</div>
                  <p className="text-xs opacity-80">Products analyzed</p>
                  <p className="text-xs opacity-90 mt-1">Smart restocking recommendations</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Sales Forecast (Next 7 Days)
                  </CardTitle>
                  <CardDescription>AI-powered sales predictions with confidence levels</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {salesAnalytics.salesForecast.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">Need more historical data for forecasting</p>
                    ) : (
                      salesAnalytics.salesForecast.map((forecast, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium">
                              {new Date(forecast.date).toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                            <p className="text-sm text-gray-600">{forecast.confidence}% confidence</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-blue-600">{forecast.predictedSales} sales</p>
                            <Progress value={forecast.confidence} className="w-16 h-2" />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Revenue Projections
                  </CardTitle>
                  <CardDescription>Future revenue estimates and growth trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {salesAnalytics.revenueForecast.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">Insufficient data for revenue forecasting</p>
                    ) : (
                      salesAnalytics.revenueForecast.map((forecast, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{forecast.period}</p>
                            <p className="text-sm text-gray-600">
                              {forecast.growth >= 0 ? "+" : ""}
                              {forecast.growth.toFixed(1)}% growth
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">₹{forecast.predictedRevenue.toFixed(0)}</p>
                            <Badge variant={forecast.growth >= 0 ? "default" : "destructive"} className="text-xs">
                              {forecast.growth >= 0 ? "Growth" : "Decline"}
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Demand Forecasting & Inventory
                  </CardTitle>
                  <CardDescription>Smart inventory recommendations based on predicted demand</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {salesAnalytics.demandForecast.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">More sales data needed for demand forecasting</p>
                    ) : (
                      salesAnalytics.demandForecast.map((forecast, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{forecast.productName}</p>
                            <p className="text-sm text-gray-600">Predicted weekly demand: {forecast.predictedDemand}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-purple-600">Stock: {forecast.recommendedStock}</p>
                            <Badge variant="outline" className="text-xs">
                              Recommended
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Customer Feedback Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[5, 4, 3, 2, 1].map((rating) => {
                      const count = feedbacks.filter((f) => f.rating === rating).length
                      const percentage = feedbacks.length > 0 ? (count / feedbacks.length) * 100 : 0
                      const emoji =
                        rating === 5 ? "😍" : rating === 4 ? "😊" : rating === 3 ? "😐" : rating === 2 ? "😞" : "😡"

                      return (
                        <div key={rating} className="flex items-center gap-3">
                          <span className="text-lg">{emoji}</span>
                          <span className="w-12 text-sm">{rating} star</span>
                          <Progress value={percentage} className="flex-1" />
                          <span className="text-sm text-gray-600 w-12">{count}</span>
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      Average Rating:{" "}
                      {feedbacks.length > 0
                        ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
                        : "N/A"}
                      /5
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  AI-Powered Business Insights & Recommendations
                </CardTitle>
                <CardDescription>Smart recommendations based on forecasting analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Sales Performance
                    </h4>
                    <p className="text-sm text-green-700">
                      {salesAnalytics.salesForecast.length > 0
                        ? salesAnalytics.salesForecast.reduce((sum, day) => sum + day.predictedSales, 0) >
                          salesAnalytics.totalSales
                          ? "📈 Growth expected! Prepare for increased demand."
                          : "📊 Stable sales predicted. Focus on customer retention."
                        : salesAnalytics.totalSales > 10
                          ? "Excellent sales volume!"
                          : salesAnalytics.totalSales > 5
                            ? "Good sales activity"
                            : "Consider marketing strategies"}
                    </p>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Inventory Optimization
                    </h4>
                    <p className="text-sm text-blue-700">
                      {salesAnalytics.demandForecast.length > 0
                        ? `🎯 ${salesAnalytics.demandForecast.length} products analyzed. Check demand forecasts for restocking.`
                        : salesAnalytics.lowStockAlerts.length === 0
                          ? "All products well stocked"
                          : `${salesAnalytics.lowStockAlerts.length} items need restocking`}
                    </p>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border border-purple-200">
                    <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Revenue Growth
                    </h4>
                    <p className="text-sm text-purple-700">
                      {salesAnalytics.revenueForecast.length > 0
                        ? salesAnalytics.revenueForecast[0].growth >= 5
                          ? "🚀 Strong growth predicted! Consider expanding inventory."
                          : salesAnalytics.revenueForecast[0].growth >= 0
                            ? "📈 Positive growth expected. Maintain current strategy."
                            : "⚠️ Revenue decline predicted. Review pricing and promotions."
                        : feedbacks.length === 0
                          ? "No feedback yet"
                          : feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length >= 4
                            ? "Customers are happy!"
                            : "Room for improvement"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={showFeedbackModal} onOpenChange={setShowFeedbackModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>How was your experience?</DialogTitle>
              <DialogDescription>Please rate your shopping experience</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="text-center">
                <p className="mb-4">Rate your experience:</p>
                <div className="flex justify-center gap-2">
                  {[
                    { rating: 1, emoji: "😡", label: "Very Bad" },
                    { rating: 2, emoji: "😞", label: "Bad" },
                    { rating: 3, emoji: "😐", label: "Average" },
                    { rating: 4, emoji: "😊", label: "Good" },
                    { rating: 5, emoji: "😍", label: "Very Good" },
                  ].map(({ rating, emoji, label }) => (
                    <Button
                      key={rating}
                      variant="outline"
                      className="flex flex-col gap-1 h-auto p-3 hover:bg-blue-50 bg-transparent"
                      onClick={() => submitFeedback(rating, emoji)}
                    >
                      <span className="text-2xl">{emoji}</span>
                      <span className="text-xs">{label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Toaster />
    </div>
  )
}
