'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, Star, TrendingUp, Users, Calendar, CreditCard } from 'lucide-react'

interface Plan {
  id: string
  name: string
  price: number
  description: string
  features: string[]
  limitations: string[]
  popular: boolean
  color: string
  pricing: {
    basePrice: number
    discountedPrice: number
    totalPrice: number
    studentCount: number
    discount: number
    discountLabel: string
    savings: number
  }
}

export default function SubscriptionManagement() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [studentCount, setStudentCount] = useState(200)
  const [selectedPlan, setSelectedPlan] = useState<string>('standard')
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)

  useEffect(() => {
    fetchPlans()
  }, [studentCount])

  const fetchPlans = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/plans?studentCount=${studentCount}`)
      if (!response.ok) {
        throw new Error('Failed to fetch plans')
      }
      const data = await response.json()
      setPlans(data.plans || [])
    } catch (error) {
      console.error('Error fetching plans:', error)
      setPlans([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = async (planId: string) => {
    setCalculating(true)
    try {
      const response = await fetch('/api/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          studentCount,
        }),
      })
      const data = await response.json()
      
      if (response.ok) {
        alert(`Quote generated! Total: ₹${data.quote.pricing.totalPrice}`)
      } else {
        alert('Error generating quote')
      }
    } catch (error) {
      console.error('Error subscribing:', error)
    } finally {
      setCalculating(false)
    }
  }

  if (loading || !plans || plans.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Perfect Plan
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Transform your school with our comprehensive management solutions
          </p>
          
          {/* Student Count Calculator */}
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Students
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="50"
                max="1000"
                step="50"
                value={studentCount}
                onChange={(e) => setStudentCount(parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-2xl font-bold text-blue-600 min-w-[80px]">
                {studentCount}
              </span>
            </div>
            {studentCount >= 100 && plans[0] && plans[0].pricing && (
              <div className="mt-2 text-sm text-green-600">
                {plans[0].pricing.discountLabel} - Save ₹{plans[0].pricing.savings}!
              </div>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative ${
                plan.popular
                  ? 'ring-2 ring-blue-500 shadow-xl transform scale-105'
                  : 'shadow-lg'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white px-4 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <CardDescription className="text-gray-600">
                  {plan.description}
                </CardDescription>
                <div className="mt-4">
                  <div className="text-4xl font-bold text-gray-900">
                    ₹{plan.pricing.discountedPrice}
                    <span className="text-lg text-gray-500">/student/year</span>
                  </div>
                  {plan.pricing.discount > 0 && (
                    <div className="text-sm text-green-600 mt-1">
                      <span className="line-through text-gray-400">
                        ₹{plan.pricing.basePrice}
                      </span>
                      {' '}{plan.pricing.discountLabel}
                    </div>
                  )}
                  <div className="text-lg font-semibold text-blue-600 mt-2">
                    Total: ₹{plan.pricing.totalPrice.toLocaleString()}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <Button
                  className={`w-full mb-6 ${
                    plan.popular
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-gray-600 hover:bg-gray-700'
                  }`}
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={calculating}
                >
                  {calculating ? 'Calculating...' : 'Get Started'}
                </Button>

                <div className="space-y-3">
                  <h4 className="font-semibold text-green-600 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    What's Included
                  </h4>
                  {plan.features.slice(0, 6).map((feature, index) => (
                    <div key={index} className="flex items-start text-sm">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                  
                  {plan.limitations.length > 0 && (
                    <>
                      <h4 className="font-semibold text-red-600 flex items-center mt-4">
                        <XCircle className="w-4 h-4 mr-2" />
                        Not Included
                      </h4>
                      {plan.limitations.map((limitation, index) => (
                        <div key={index} className="flex items-start text-sm">
                          <XCircle className="w-4 h-4 mr-2 text-red-500 mt-0.5 flex-shrink-0" />
                          <span>{limitation}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Value Proposition */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-center mb-8">
            Why Schools Choose ReportCard+
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">85% Cost Savings</h3>
              <p className="text-gray-600 text-sm">
                Reduce administrative costs by 85% with complete digitization
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">400%+ ROI</h3>
              <p className="text-gray-600 text-sm">
                Get your investment back in just 2.1 months with massive returns
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                <Star className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Premium Features</h3>
              <p className="text-gray-600 text-sm">
                Enterprise-grade platform with advanced analytics and support
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">How does volume discount work?</h3>
              <p className="text-gray-600">
                We offer automatic discounts: 10% for 100+ students, 15% for 300+ students, and 20% for 500+ students.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Can I change plans later?</h3>
              <p className="text-gray-600">
                Yes! You can upgrade or downgrade your plan at any time. Changes will be prorated.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-600">
                We accept all major payment methods: Credit Card, Debit Card, UPI, Net Banking, and Bank Transfer.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Is there a setup fee?</h3>
              <p className="text-gray-600">
                No setup fee for schools under 500 students. Larger schools may have a small implementation fee.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}