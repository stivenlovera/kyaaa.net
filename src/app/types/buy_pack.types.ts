export interface IBuyPack {
    user_id: number;
    pack_id: number;
}

//PAYPAL
export interface IPayPalToken {
    scope: string
    access_token: string
    token_type: string
    app_id: string
    expires_in: number
    nonce: string
}

export interface IPayPalCheckOrder {
    id: string
    status: string
    links: IPayPalCheckOrderLink[]
}

export interface IPayPalCheckOrderLink {
    href: string
    rel: string
    method: string
}

export interface IPayPalConfirm {
  id: string
  status: string
  payment_source: PaymentSource
  purchase_units: PurchaseUnit[]
  payer: Payer
  links: Link2[]
}

export interface PaymentSource {
  paypal: Paypal
}

export interface Paypal {
  email_address: string
  account_id: string
  account_status: string
  name: Name
  address: Address
}

export interface Name {
  given_name: string
  surname: string
}

export interface Address {
  country_code: string
}

export interface PurchaseUnit {
  reference_id: string
  shipping: Shipping
  payments: Payments
}

export interface Shipping {
  name: Name2
  address: Address2
}

export interface Name2 {
  full_name: string
}

export interface Address2 {
  address_line_1: string
  admin_area_2: string
  admin_area_1: string
  postal_code: string
  country_code: string
}

export interface Payments {
  captures: Capture[]
}

export interface Capture {
  id: string
  status: string
  amount: Amount
  final_capture: boolean
  seller_protection: SellerProtection
  seller_receivable_breakdown?: SellerReceivableBreakdown
  links: Link[]
  create_time: string
  update_time: string
}

export interface Amount {
  currency_code: string
  value: string
}

export interface SellerProtection {
  status: string
  dispute_categories: string[]
}

export interface SellerReceivableBreakdown {
  gross_amount: GrossAmount
  paypal_fee?: PaypalFee
  net_amount: NetAmount
}

export interface GrossAmount {
  currency_code: string
  value: string
}

export interface PaypalFee {
  currency_code: string
  value: string
}

export interface NetAmount {
  currency_code: string
  value: string
}

export interface Link {
  href: string
  rel: string
  method: string
}

export interface Payer {
  name: Name3
  email_address: string
  payer_id: string
  address: Address3
}

export interface Name3 {
  given_name: string
  surname: string
}

export interface Address3 {
  country_code: string
}

export interface Link2 {
  href: string
  rel: string
  method: string
}

