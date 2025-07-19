"use client"

import { Application } from '@/lib/applications'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Calendar, DollarSign, MapPin, User, Mail, Phone, FileText, Building, CreditCard } from 'lucide-react'

interface ApplicationDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  application: Application | null
}

export function ApplicationDetailsModal({ isOpen, onClose, application }: ApplicationDetailsModalProps) {
  if (!application) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-blue-100 text-blue-800"
      case "approved":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-md sm:max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <FileText className="h-5 w-5" />
            Application Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Application Status */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <Badge className={getStatusColor(application.status)}>
                {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
              </Badge>
              <span className="text-sm text-gray-500">
                Applied on {formatDate(application.created_at)}
              </span>
            </div>
            {application.updated_at !== application.created_at && (
              <span className="text-sm text-gray-500">
                Updated on {formatDate(application.updated_at)}
              </span>
            )}
          </div>

          {/* Applicant Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Applicant Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <Avatar className="h-16 w-16 mx-auto sm:mx-0">
                  <AvatarFallback className="text-lg">
                    {application.tenant_name
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3 text-center sm:text-left">
                  <h3 className="text-lg font-semibold">{application.tenant_name}</h3>
                  <div className="space-y-3 sm:space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="flex items-center justify-center sm:justify-start gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="text-sm break-all">{application.tenant_email}</span>
                      </div>
                    </div>
                    {application.tenant_phone && (
                      <div className="flex items-center justify-center sm:justify-start gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{application.tenant_phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Voucher Information */}
          {(application.has_section8_voucher !== undefined) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Section 8 Voucher Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="font-medium">Section 8 Voucher Status</div>
                      <div className="flex items-center gap-2 mt-1">
                        {application.has_section8_voucher ? (
                          <Badge className="bg-green-100 text-green-800">
                            Has Section 8 Voucher
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800">
                            No Section 8 Voucher
                          </Badge>
                        )}
                      </div>
                    </div>
                    {application.has_section8_voucher && application.voucher_bedroom_count && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {application.voucher_bedroom_count}
                        </div>
                        <div className="text-sm text-gray-500">Voucher Size</div>
                      </div>
                    )}
                  </div>
                  {application.has_section8_voucher && application.voucher_bedroom_count && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Voucher Coverage:</strong> This tenant has a Section 8 voucher that covers up to {application.voucher_bedroom_count} bedroom{application.voucher_bedroom_count > 1 ? 's' : ''}. 
                        The voucher will typically cover a portion of the rent, with the tenant responsible for the remaining amount.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Property Information */}
          {application.properties && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Property Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const props = application.properties;
                  
                  // Handle case where properties might be a JSON string
                  let parsedProps: any = props;
                  if (typeof props === 'string') {
                    try {
                      parsedProps = JSON.parse(props);
                    } catch (e) {
                      console.error('Error parsing properties JSON:', e);
                      return (
                        <div className="text-sm text-gray-500">
                          Unable to display property information
                        </div>
                      );
                    }
                  }
                  
                  return (
                    <div className="space-y-3">
                      <h3 className="font-semibold">{parsedProps.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>
                          {parsedProps.address}
                          {parsedProps.city && `, ${parsedProps.city}`}
                          {parsedProps.state && ` ${parsedProps.state}`}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">
                            {formatCurrency(Number(parsedProps.price) || 0)}
                          </div>
                          <div className="text-sm text-gray-500">Monthly Rent</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">{parsedProps.bedrooms}</div>
                          <div className="text-sm text-gray-500">Bedrooms</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">{parsedProps.bathrooms}</div>
                          <div className="text-sm text-gray-500">Bathrooms</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">{parsedProps.sqft || 'N/A'}</div>
                          <div className="text-sm text-gray-500">Sq Ft</div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          {/* Application Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Application Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {application.move_in_date && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <div>
                    <div className="font-medium">Desired Move-in Date</div>
                    <div className="text-sm text-gray-600">
                      {formatDate(application.move_in_date)}
                    </div>
                  </div>
                </div>
              )}

              {/* Employment status and income fields removed - not in database schema */}

              {application.message && (
                <div className="mt-4">
                  <div className="font-medium mb-2">Message from Applicant</div>
                  <div className="bg-gray-50 p-3 rounded-lg text-sm">
                    {application.message}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Financial Assessment section removed - monthly_income field not in database schema */}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
