"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Package, ShoppingCart, CreditCard, Receipt, Plus, Edit, Trash2, Search, Settings, Mail } from "lucide-react"

interface Product {
  code: string
  name: string
  price: number
  stock: number
}

interface CartItem extends Product {
  quantity: number
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
}

interface EmailSettings {
  apiKey: string
  senderEmail: string
  senderName: string
}

export default function RetailStoreApp() {
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [activeTab, setActiveTab] = useState("products")
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddProductOpen, setIsAddProductOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [newProduct, setNewProduct] = useState({ code: "", name: "", price: 0, stock: 0 })
  const [bills, setBills] = useState<Bill[]>([])
  const [customerName, setCustomerName] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [amountReceived, setAmountReceived] = useState(0)

  const [customerEmail, setCustomerEmail] = useState("")
  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    apiKey: "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",
    senderEmail: "",
    senderName: "Retail Store",
  })
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [showUpiQr, setShowUpiQr] = useState(false)
  const [cardDetails, setCardDetails] = useState({
    number: "",
    expiry: "",
    cvv: "",
    name: "",
  })
  const [selectedBank, setSelectedBank] = useState("")

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

  const loadDataFromStorage = () => {
    try {
      const savedProducts = localStorage.getItem("retail-store-products")
      const savedBills = localStorage.getItem("retail-store-bills")
      const savedEmailSettings = localStorage.getItem("retail-store-email-settings")

      if (savedProducts) {
        setProducts(JSON.parse(savedProducts))
      } else {
        // Default products if no saved data
        const defaultProducts = [
          { code: "P001", name: "Laptop", price: 50000, stock: 10 },
          { code: "P002", name: "Mouse", price: 500, stock: 25 },
          { code: "P003", name: "Keyboard", price: 1500, stock: 15 },
        ]
        setProducts(defaultProducts)
        saveProductsToStorage(defaultProducts)
      }

      if (savedBills) {
        setBills(JSON.parse(savedBills))
      }

      if (savedEmailSettings) {
        setEmailSettings(JSON.parse(savedEmailSettings))
      }
    } catch (error) {
      console.error("Failed to load data from localStorage:", error)
      // Fallback to default products on error
      const defaultProducts = [
        { code: "P001", name: "Laptop", price: 50000, stock: 10 },
        { code: "P002", name: "Mouse", price: 500, stock: 25 },
        { code: "P003", name: "Keyboard", price: 1500, stock: 15 },
      ]
      setProducts(defaultProducts)
    }
  }

  useEffect(() => {
    loadDataFromStorage()
  }, [])

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
    saveEmailSettingsToStorage(emailSettings)
  }, [emailSettings])

  const sendEmailReceipt = async (bill: Bill, customerEmail: string) => {
    if (!emailSettings.apiKey || !emailSettings.senderEmail) {
      toast({
        title: "Email Configuration Missing",
        description: "Please configure email settings first",
        variant: "destructive",
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
        throw new Error(result.error || "Failed to send email")
      }
    } catch (error) {
      console.error("Email sending error:", error)
      toast({
        title: "Email Failed",
        description: "Failed to send receipt email",
        variant: "destructive",
      })
      return false
    }
  }

  const generateUpiQr = (amount: number) => {
    const upiId = "pruthvinarayanareddy@okicici"
    const merchantName = "Retail Store"
    const upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR`
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiString)}`
  }

  // Product Management Functions
  const handleAddProduct = () => {
    if (!newProduct.code || !newProduct.name || newProduct.price <= 0 || newProduct.stock < 0) {
      toast({
        title: "Invalid Input",
        description: "Please fill all fields with valid values",
        variant: "destructive",
      })
      return
    }

    if (products.find((p) => p.code === newProduct.code)) {
      toast({
        title: "Product Exists",
        description: "A product with this code already exists",
        variant: "destructive",
      })
      return
    }

    setProducts([...products, { ...newProduct }])
    setNewProduct({ code: "", name: "", price: 0, stock: 0 })
    setIsAddProductOpen(false)
    toast({
      title: "Product Added",
      description: `${newProduct.name} has been added successfully`,
    })
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setNewProduct({ ...product })
    setIsAddProductOpen(true)
  }

  const handleUpdateProduct = () => {
    if (!newProduct.code || !newProduct.name || newProduct.price <= 0 || newProduct.stock < 0) {
      toast({
        title: "Invalid Input",
        description: "Please fill all fields with valid values",
        variant: "destructive",
      })
      return
    }

    setProducts(products.map((p) => (p.code === editingProduct?.code ? { ...newProduct } : p)))
    setNewProduct({ code: "", name: "", price: 0, stock: 0 })
    setEditingProduct(null)
    setIsAddProductOpen(false)
    toast({
      title: "Product Updated",
      description: `${newProduct.name} has been updated successfully`,
    })
  }

  const handleDeleteProduct = (code: string) => {
    setProducts(products.filter((p) => p.code !== code))
    toast({
      title: "Product Deleted",
      description: "Product has been removed from inventory",
    })
  }

  // POS Functions
  const addToCart = (product: Product, quantity = 1) => {
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
      setCart(cart.map((item) => (item.code === product.code ? { ...item, quantity: item.quantity + quantity } : item)))
    } else {
      setCart([...cart, { ...product, quantity }])
    }

    toast({
      title: "Added to Cart",
      description: `${quantity}x ${product.name} added to cart`,
    })
  }

  const removeFromCart = (code: string) => {
    setCart(cart.filter((item) => item.code !== code))
  }

  const updateCartQuantity = (code: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(code)
      return
    }

    setCart(cart.map((item) => (item.code === code ? { ...item, quantity } : item)))
  }

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const processPayment = async () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to cart before processing payment",
        variant: "destructive",
      })
      return
    }

    const total = getCartTotal()

    if (paymentMethod === "cash" && amountReceived < total) {
      toast({
        title: "Insufficient Amount",
        description: `Amount received (₹${amountReceived}) is less than total (₹${total.toFixed(2)})`,
        variant: "destructive",
      })
      return
    }

    if (
      paymentMethod === "card" &&
      (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvv || !cardDetails.name)
    ) {
      toast({
        title: "Incomplete Card Details",
        description: "Please fill all card details",
        variant: "destructive",
      })
      return
    }

    if (paymentMethod === "netbanking" && !selectedBank) {
      toast({
        title: "Bank Not Selected",
        description: "Please select a bank for net banking",
        variant: "destructive",
      })
      return
    }

    // Generate bill
    const newBill: Bill = {
      id: `BILL-${Date.now()}`,
      date: new Date().toLocaleString(),
      items: [...cart],
      total,
      paymentMethod,
      customerName: customerName || "Walk-in Customer",
      customerEmail: customerEmail || undefined,
      emailSent: false,
    }

    // Send email if customer email is provided
    if (customerEmail && customerEmail.includes("@")) {
      const emailSent = await sendEmailReceipt(newBill, customerEmail)
      newBill.emailSent = emailSent
    }

    // Update stock
    const updatedProducts = products.map((product) => {
      const cartItem = cart.find((item) => item.code === product.code)
      if (cartItem) {
        return { ...product, stock: product.stock - cartItem.quantity }
      }
      return product
    })

    setProducts(updatedProducts)
    setBills([newBill, ...bills])
    setCart([])
    setCustomerName("")
    setCustomerEmail("")
    setAmountReceived(0)
    setCardDetails({ number: "", expiry: "", cvv: "", name: "" })
    setSelectedBank("")
    setShowUpiQr(false)
    setActiveTab("bills")

    toast({
      title: "Payment Successful",
      description: `Bill ${newBill.id} generated successfully`,
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Retail Store Management</h1>
            <p className="text-muted-foreground">Manage your products and process sales efficiently</p>
          </div>
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Email Settings</DialogTitle>
                <DialogDescription>Configure email settings for sending receipts</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div>
                  <Label htmlFor="api-key">SendGrid API Key</Label>
                  <Input
                    id="api-key"
                    value={emailSettings.apiKey}
                    onChange={(e) => setEmailSettings({ ...emailSettings, apiKey: e.target.value })}
                    placeholder="Enter SendGrid API Key"
                  />
                </div>
                <div>
                  <Label htmlFor="sender-email">Sender Email</Label>
                  <Input
                    id="sender-email"
                    type="email"
                    value={emailSettings.senderEmail}
                    onChange={(e) => setEmailSettings({ ...emailSettings, senderEmail: e.target.value })}
                    placeholder="Enter your email address"
                  />
                </div>
                <div>
                  <Label htmlFor="sender-name">Sender Name</Label>
                  <Input
                    id="sender-name"
                    value={emailSettings.senderName}
                    onChange={(e) => setEmailSettings({ ...emailSettings, senderName: e.target.value })}
                    placeholder="Enter sender name"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => setIsSettingsOpen(false)}>Save Settings</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Main Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="pos" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Point of Sale
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment
            </TabsTrigger>
            <TabsTrigger value="bills" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Bills
            </TabsTrigger>
          </TabsList>

          {/* Product Management Tab */}
          <TabsContent value="products" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Product Management</CardTitle>
                    <CardDescription>Add, edit, and manage your inventory</CardDescription>
                  </div>
                  <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => {
                          setEditingProduct(null)
                          setNewProduct({ code: "", name: "", price: 0, stock: 0 })
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Product
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
                        <DialogDescription>
                          {editingProduct ? "Update product information" : "Enter product details to add to inventory"}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="code" className="text-right">
                            Code
                          </Label>
                          <Input
                            id="code"
                            value={newProduct.code}
                            onChange={(e) => setNewProduct({ ...newProduct, code: e.target.value.toUpperCase() })}
                            className="col-span-3"
                            disabled={!!editingProduct}
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="name" className="text-right">
                            Name
                          </Label>
                          <Input
                            id="name"
                            value={newProduct.name}
                            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="price" className="text-right">
                            Price (₹)
                          </Label>
                          <Input
                            id="price"
                            type="number"
                            value={newProduct.price}
                            onChange={(e) =>
                              setNewProduct({ ...newProduct, price: Number.parseFloat(e.target.value) || 0 })
                            }
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
                            value={newProduct.stock}
                            onChange={(e) =>
                              setNewProduct({ ...newProduct, stock: Number.parseInt(e.target.value) || 0 })
                            }
                            className="col-span-3"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={editingProduct ? handleUpdateProduct : handleAddProduct}>
                          {editingProduct ? "Update Product" : "Add Product"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {/* Search */}
                <div className="flex items-center space-x-2 mb-4">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>

                {/* Products Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.code}>
                        <TableCell className="font-medium">{product.code}</TableCell>
                        <TableCell>{product.name}</TableCell>
                        <TableCell>₹{product.price.toFixed(2)}</TableCell>
                        <TableCell>{product.stock}</TableCell>
                        <TableCell>
                          <Badge
                            variant={product.stock > 10 ? "default" : product.stock > 0 ? "secondary" : "destructive"}
                          >
                            {product.stock > 10 ? "In Stock" : product.stock > 0 ? "Low Stock" : "Out of Stock"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditProduct(product)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="h-4 w-4" />
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
                                  <AlertDialogAction onClick={() => handleDeleteProduct(product.code)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Point of Sale Tab */}
          <TabsContent value="pos" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Product Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Select Products</CardTitle>
                  <CardDescription>Click on products to add them to cart</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {products
                      .filter((p) => p.stock > 0)
                      .map((product) => (
                        <Card
                          key={product.code}
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => addToCart(product)}
                        >
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-semibold">{product.name}</h3>
                              <Badge variant="secondary">{product.code}</Badge>
                            </div>
                            <p className="text-2xl font-bold text-primary">₹{product.price.toFixed(2)}</p>
                            <p className="text-sm text-muted-foreground">Stock: {product.stock}</p>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Shopping Cart */}
              <Card>
                <CardHeader>
                  <CardTitle>Shopping Cart</CardTitle>
                  <CardDescription>{cart.length} items in cart</CardDescription>
                </CardHeader>
                <CardContent>
                  {cart.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Cart is empty</p>
                  ) : (
                    <div className="space-y-4">
                      {cart.map((item) => (
                        <div key={item.code} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <h4 className="font-medium">{item.name}</h4>
                            <p className="text-sm text-muted-foreground">₹{item.price.toFixed(2)} each</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateCartQuantity(item.code, item.quantity - 1)}
                            >
                              -
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateCartQuantity(item.code, item.quantity + 1)}
                            >
                              +
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => removeFromCart(item.code)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center text-lg font-bold">
                          <span>Total:</span>
                          <span>₹{getCartTotal().toFixed(2)}</span>
                        </div>
                        <Button
                          className="w-full mt-4"
                          onClick={() => setActiveTab("payment")}
                          disabled={cart.length === 0}
                        >
                          Proceed to Payment
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Payment Tab */}
          <TabsContent value="payment" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                  <CardDescription>Review your order before payment</CardDescription>
                </CardHeader>
                <CardContent>
                  {cart.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No items in cart</p>
                  ) : (
                    <div className="space-y-4">
                      {cart.map((item) => (
                        <div key={item.code} className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">{item.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              ₹{item.price.toFixed(2)} × {item.quantity}
                            </p>
                          </div>
                          <span className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center text-xl font-bold">
                          <span>Total Amount:</span>
                          <span>₹{getCartTotal().toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Details</CardTitle>
                  <CardDescription>Enter payment information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="customer">Customer Name (Optional)</Label>
                    <Input
                      id="customer"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Enter customer name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="customer-email">Customer Email (Optional)</Label>
                    <Input
                      id="customer-email"
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="Enter customer email for receipt"
                    />
                  </div>

                  <div>
                    <Label htmlFor="payment-method">Payment Method</Label>
                    <select
                      id="payment-method"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full p-2 border border-input rounded-md bg-background"
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="netbanking">Net Banking</option>
                      <option value="upi">UPI</option>
                    </select>
                  </div>

                  {paymentMethod === "cash" && (
                    <div>
                      <Label htmlFor="amount-received">Amount Received</Label>
                      <Input
                        id="amount-received"
                        type="number"
                        value={amountReceived}
                        onChange={(e) => setAmountReceived(Number.parseFloat(e.target.value) || 0)}
                        placeholder="Enter amount received"
                      />
                      {amountReceived > getCartTotal() && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Change: ₹{(amountReceived - getCartTotal()).toFixed(2)}
                        </p>
                      )}
                    </div>
                  )}

                  {paymentMethod === "card" && (
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="card-number">Card Number</Label>
                        <Input
                          id="card-number"
                          value={cardDetails.number}
                          onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                          placeholder="1234 5678 9012 3456"
                          maxLength={19}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="card-expiry">Expiry Date</Label>
                          <Input
                            id="card-expiry"
                            value={cardDetails.expiry}
                            onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                            placeholder="MM/YY"
                            maxLength={5}
                          />
                        </div>
                        <div>
                          <Label htmlFor="card-cvv">CVV</Label>
                          <Input
                            id="card-cvv"
                            value={cardDetails.cvv}
                            onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                            placeholder="123"
                            maxLength={3}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="card-name">Cardholder Name</Label>
                        <Input
                          id="card-name"
                          value={cardDetails.name}
                          onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                          placeholder="Enter cardholder name"
                        />
                      </div>
                    </div>
                  )}

                  {paymentMethod === "netbanking" && (
                    <div>
                      <Label htmlFor="bank-select">Select Bank</Label>
                      <select
                        id="bank-select"
                        value={selectedBank}
                        onChange={(e) => setSelectedBank(e.target.value)}
                        className="w-full p-2 border border-input rounded-md bg-background"
                      >
                        <option value="">Select Bank</option>
                        <option value="sbi">State Bank of India</option>
                        <option value="hdfc">HDFC Bank</option>
                        <option value="icici">ICICI Bank</option>
                        <option value="axis">Axis Bank</option>
                        <option value="pnb">Punjab National Bank</option>
                        <option value="bob">Bank of Baroda</option>
                      </select>
                    </div>
                  )}

                  {paymentMethod === "upi" && (
                    <div className="space-y-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowUpiQr(!showUpiQr)}
                        className="w-full"
                      >
                        {showUpiQr ? "Hide QR Code" : "Generate QR Code"}
                      </Button>
                      {showUpiQr && (
                        <div className="text-center space-y-3">
                          <img
                            src={generateUpiQr(getCartTotal()) || "/placeholder.svg"}
                            alt="UPI QR Code"
                            className="mx-auto border rounded-lg"
                          />
                          <p className="text-sm text-muted-foreground">
                            Scan QR code to pay ₹{getCartTotal().toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">UPI ID: pruthvinarayanareddy@okicici</p>
                        </div>
                      )}
                    </div>
                  )}

                  <Button className="w-full" onClick={processPayment} disabled={cart.length === 0}>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Process Payment
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Bills Tab */}
          <TabsContent value="bills" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Bill Management</CardTitle>
                <CardDescription>View and manage generated bills</CardDescription>
              </CardHeader>
              <CardContent>
                {bills.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No bills generated yet</p>
                ) : (
                  <div className="space-y-4">
                    {bills.map((bill) => (
                      <Card key={bill.id}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">{bill.id}</CardTitle>
                              <CardDescription>
                                {bill.date} • {bill.customerName} • {bill.paymentMethod.toUpperCase()}
                                {bill.customerEmail && (
                                  <span className="ml-2">
                                    <Mail
                                      className={`inline h-3 w-3 ${bill.emailSent ? "text-green-500" : "text-red-500"}`}
                                    />
                                    {bill.emailSent ? " Email Sent" : " Email Failed"}
                                  </span>
                                )}
                              </CardDescription>
                            </div>
                            <Badge variant="outline">₹{bill.total.toFixed(2)}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Item</TableHead>
                                <TableHead>Qty</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Total</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {bill.items.map((item) => (
                                <TableRow key={item.code}>
                                  <TableCell>{item.name}</TableCell>
                                  <TableCell>{item.quantity}</TableCell>
                                  <TableCell>₹{item.price.toFixed(2)}</TableCell>
                                  <TableCell>₹{(item.price * item.quantity).toFixed(2)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                          {bill.customerEmail && (
                            <div className="mt-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => sendEmailReceipt(bill, bill.customerEmail!)}
                              >
                                <Mail className="h-4 w-4 mr-2" />
                                Resend Email
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <Toaster />
    </div>
  )
}
