import { FormEvent, useEffect, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Copy,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Truck,
  X,
} from 'lucide-react';
import { BD_DIVISIONS, resolveDeliveryAreaForDistrict } from '../data/bdLocations';
import { storage } from '../services/storage';
import type {
  CartItem,
  DeliveryArea,
  Order,
  PaymentMethod,
  Product,
  StoreSettings,
  User,
} from '../types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  currentUser: User | null;
  onOrderSuccess: (order: Order) => void;
  createOrder: (
    orderInput: Omit<
      Order,
      'id' | 'date' | 'status' | 'courierPartner' | 'trackingCode' | 'timeline'
    >
  ) => Promise<Order>;
  settings: StoreSettings;
  products: Product[];
}

export function CheckoutModal({
  isOpen,
  onClose,
  items,
  currentUser,
  onOrderSuccess,
  createOrder,
  settings,
  products,
}: CheckoutModalProps) {
  const isCodBlocked = items.some(
    (item) => products.find((p) => p.id === item.productId)?.isCodAvailable === false
  );

  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [customerEmail, setCustomerEmail] = useState(currentUser?.email || '');
  const [address, setAddress] = useState(currentUser?.address || '');
  const [divisionId, setDivisionId] = useState('dhaka');
  const [district, setDistrict] = useState(currentUser?.district || 'Dhaka');
  const [deliveryArea, setDeliveryArea] = useState<DeliveryArea>('inside_dhaka');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    isCodBlocked ? 'bKash' : 'COD'
  );
  const [senderNumber, setSenderNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [copiedMerchant, setCopiedMerchant] = useState(false);

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
    description: string;
  } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  const selectedDivision =
    BD_DIVISIONS.find((d) => d.id === divisionId) || BD_DIVISIONS[0];
  const districts = selectedDivision.districts;

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg('');
    if (isCodBlocked && paymentMethod === 'COD') {
      setPaymentMethod('bKash');
    }
    if (currentUser) {
      setName((prev) => prev || currentUser.name || '');
      setPhone((prev) => prev || currentUser.phone || '');
      setCustomerEmail((prev) => prev || currentUser.email || '');
      setAddress((prev) => prev || currentUser.address || '');
      if (currentUser.district) {
        const q = currentUser.district.toLowerCase();
        for (const div of BD_DIVISIONS) {
          const found = div.districts.find(
            (dist) =>
              dist.nameEn.toLowerCase() === q ||
              dist.nameBn.toLowerCase() === q ||
              dist.label.toLowerCase().includes(q)
          );
          if (found) {
            setDivisionId(div.id);
            setDistrict(found.nameEn);
            setDeliveryArea(found.defaultArea);
            break;
          }
        }
      }
    }
  }, [isOpen, currentUser, isCodBlocked, paymentMethod]);

  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee =
    deliveryArea === 'inside_dhaka'
      ? settings.insideDhakaFee || 70
      : deliveryArea === 'sub_dhaka'
      ? settings.subDhakaFee || 100
      : settings.outsideDhakaFee || 130;
  const discount = appliedCoupon ? appliedCoupon.discount : 0;
  const total = Math.max(0, subtotal + deliveryFee - discount);

  const merchantNumber =
    (paymentMethod === 'Nagad' ? settings.nagadMerchant : settings.bkashMerchant) ||
    '01994618066';

  const handleDivisionChange = (nextDivId: string) => {
    setDivisionId(nextDivId);
    const div = BD_DIVISIONS.find((d) => d.id === nextDivId);
    if (div && div.districts.length > 0) {
      const firstDist = div.districts[0];
      setDistrict(firstDist.nameEn);
      setDeliveryArea(firstDist.defaultArea);
    }
  };

  const handleDistrictChange = (nextDistrict: string) => {
    setDistrict(nextDistrict);
    setDeliveryArea(resolveDeliveryAreaForDistrict(nextDistrict));
  };

  const handleApplyCoupon = (e: FormEvent) => {
    e.preventDefault();
    setCouponError('');
    setCouponSuccess('');
    if (!couponInput.trim()) return;
    const result = storage.validateCoupon(couponInput, subtotal);
    if (result.valid && result.coupon) {
      setAppliedCoupon({
        code: result.coupon.code,
        discount: result.discount,
        description: result.coupon.description,
      });
      setCouponSuccess(result.message);
    } else {
      setCouponError(result.message);
    }
  };

  const handleClearCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError('');
    setCouponSuccess('');
  };

  const buildWhatsappConfirmUrl = (order: Order) => {
    const zoneText =
      order.deliveryArea === 'inside_dhaka'
        ? `ঢাকা সিটির ভিতরে (৳${order.deliveryFee})`
        : order.deliveryArea === 'sub_dhaka'
        ? `সাব-ঢাকা: গাজীপুর/নারায়ণগঞ্জ (৳${order.deliveryFee})`
        : `ঢাকার বাইরে সারাদেশে (৳${order.deliveryFee})`;

    const itemsLines = order.items
      .map((it) => `• ${it.name} (${it.weight}) x${it.quantity} = ৳${it.price * it.quantity}`)
      .join('\n');

    const msg = `🚨 *নতুন অর্ডার নোটিফিকেশন (KYNZO Store)*\n\n📦 *অর্ডার আইডি:* ${order.id}\n👤 *গ্রাহকের নাম:* ${order.customerName}\n📞 *মোবাইল নম্বর:* ${order.customerPhone}\n📍 *ঠিকানা:* ${order.customerAddress}, ${order.district}\n🚚 *ডেলিভারি জোন:* ${zoneText}\n💳 *পেমেন্ট:* ${order.paymentMethod} (${order.paymentStatus})\n\n🛍️ *পণ্যসমূহ:*\n${itemsLines}\n\n💰 *সর্বমোট বিল:* ৳${order.total}`;

    return `https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(msg)}`;
  };

  const handlePlaceOrder = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim() || !phone.trim() || !address.trim()) {
      setErrorMsg('অনুগ্রহ করে আপনার নাম, মোবাইল নম্বর এবং পূর্ণ ঠিকানা লিখুন।');
      return;
    }

    if (paymentMethod !== 'COD' && (!senderNumber.trim() || !transactionId.trim())) {
      setErrorMsg(
        `অনুগ্রহ করে ${paymentMethod} সেন্ডার নম্বর এবং ট্রানজেকশন আইডি (TrxID) প্রদান করুন।`
      );
      return;
    }

    setSubmitting(true);
    try {
      const created = await createOrder({
        userId: currentUser?.id,
        customerName: name.trim(),
        customerPhone: phone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        customerAddress: address.trim(),
        district,
        division: selectedDivision.nameEn,
        deliveryArea,
        deliveryFee,
        items: items.map((it) => ({
          productId: it.productId,
          name: it.name,
          price: it.price,
          quantity: it.quantity,
          weight: it.weight,
          image: it.image,
        })),
        subtotal,
        discount,
        couponCode: appliedCoupon?.code,
        total,
        paymentMethod,
        paymentStatus:
          paymentMethod === 'COD'
            ? 'Unpaid (Cash on Delivery)'
            : `Pending Verification (${paymentMethod})`,
        senderNumber: senderNumber.trim() || undefined,
        transactionId: transactionId.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      setPlacedOrder(created);
      onOrderSuccess(created);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'অর্ডার সম্পন্ন করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setPlacedOrder(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="relative bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden my-4 border border-slate-200 flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#F8FAFC]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#2563EB]" />
            <h2 className="text-lg font-extrabold text-[#0F172A] font-display">
              {placedOrder ? 'অর্ডার সফলভাবে সম্পন্ন হয়েছে!' : 'Secure Checkout (অর্ডার সম্পন্ন করুন)'}
            </h2>
          </div>

          <button
            type="button"
            onClick={handleCloseModal}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            aria-label="Close checkout"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 sm:p-6 lg:p-8">
          {placedOrder ? (
            <div className="text-center space-y-5 py-4 animate-in fade-in">
              <div className="w-16 h-16 rounded-full bg-blue-100 text-[#2563EB] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB] bg-[#EFF6FF] px-3 py-1 rounded-full">
                  Order Confirmed
                </span>
                <h3 className="text-2xl font-black text-[#0F172A] font-display mt-3">
                  ধন্যবাদ, {placedOrder.customerName}!
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  আপনার অর্ডার নম্বর:{' '}
                  <strong className="font-mono text-[#2563EB]">{placedOrder.id}</strong> ·
                  ট্র্যাকিং কোড:{' '}
                  <strong className="font-mono text-[#2563EB]">{placedOrder.trackingCode}</strong>
                </p>
              </div>

              <div className="max-w-md mx-auto p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200 text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">ঠিকানা:</span>
                  <span className="font-semibold text-slate-800 text-right">
                    {placedOrder.customerAddress}, {placedOrder.district}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">পেমেন্ট পদ্ধতি:</span>
                  <span className="font-bold text-slate-800">{placedOrder.paymentMethod}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 text-sm">
                  <span className="font-bold text-slate-700">সর্বমোট বিল:</span>
                  <span className="font-black text-[#2563EB] tabular-nums">
                    ৳{placedOrder.total}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <a
                  href={buildWhatsappConfirmUrl(placedOrder)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp-এ অর্ডার পাঠান</span>
                </a>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-3 rounded-xl bg-[#0B1120] hover:bg-[#2563EB] text-white font-bold text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  শপিং চালিয়ে যান
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-5">
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
                    {errorMsg}
                  </div>
                )}

                <div className="space-y-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#0F172A] flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#2563EB]" />
                    <span>ডেলিভারি তথ্য (Delivery Information)</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        আপনার পূর্ণ নাম *
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="যেমন: তানভীর হোসেন"
                        className="w-full bg-[#F8FAFC] focus:bg-white border border-slate-300 focus:border-[#2563EB] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        মোবাইল নম্বর *
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="01XXXXXXXXX"
                        className="w-full bg-[#F8FAFC] focus:bg-white border border-slate-300 focus:border-[#2563EB] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Gmail / Email (অর্ডার আপডেটের জন্য - ঐচ্ছিক)
                    </label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="example@gmail.com"
                      className="w-full bg-[#F8FAFC] focus:bg-white border border-slate-300 focus:border-[#2563EB] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        বিভাগ (Division) *
                      </label>
                      <select
                        value={divisionId}
                        onChange={(e) => handleDivisionChange(e.target.value)}
                        className="w-full bg-[#F8FAFC] focus:bg-white border border-slate-300 focus:border-[#2563EB] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm outline-none"
                      >
                        {BD_DIVISIONS.map((div) => (
                          <option key={div.id} value={div.id}>
                            {div.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        জেলা (District) *
                      </label>
                      <select
                        value={district}
                        onChange={(e) => handleDistrictChange(e.target.value)}
                        className="w-full bg-[#F8FAFC] focus:bg-white border border-slate-300 focus:border-[#2563EB] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm outline-none"
                      >
                        {districts.map((d) => (
                          <option key={d.id} value={d.nameEn}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      ডেলিভারি এলাকা (Delivery Zone)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        [
                          {
                            id: 'inside_dhaka',
                            label: 'ঢাকা সিটি',
                            fee: settings.insideDhakaFee || 70,
                          },
                          {
                            id: 'sub_dhaka',
                            label: 'সাব-ঢাকা',
                            fee: settings.subDhakaFee || 100,
                          },
                          {
                            id: 'outside_dhaka',
                            label: 'সারাদেশে',
                            fee: settings.outsideDhakaFee || 130,
                          },
                        ] as const
                      ).map((zone) => (
                        <button
                          key={zone.id}
                          type="button"
                          onClick={() => setDeliveryArea(zone.id)}
                          className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                            deliveryArea === zone.id
                              ? 'bg-[#0B1120] text-white border-[#0B1120]'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-[#EFF6FF]'
                          }`}
                        >
                          <span className="block text-[11px] font-bold">{zone.label}</span>
                          <span className="block text-xs font-extrabold tabular-nums">
                            ৳{zone.fee}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      পূর্ণ ডেলিভারি ঠিকানা (বাসা/রোড/এলাকা/থানা) *
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="বাড়ি নং, রোড নং, এলাকা, থানা লিখুন..."
                      className="w-full bg-[#F8FAFC] focus:bg-white border border-slate-300 focus:border-[#2563EB] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#0F172A]">
                    পেমেন্ট পদ্ধতি (Payment Method)
                  </h3>

                  {isCodBlocked && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                      আপনার কার্টে প্রিমিয়াম গ্যাজেট থাকায় ক্যাশ অন ডেলিভারি সাময়িকভাবে বন্ধ আছে।
                      অনুগ্রহ করে bKash বা Nagad ব্যবহার করুন।
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2.5">
                    {(['COD', 'bKash', 'Nagad'] as const).map((method) => {
                      const disabled = method === 'COD' && isCodBlocked;
                      return (
                        <button
                          key={method}
                          type="button"
                          disabled={disabled}
                          onClick={() => setPaymentMethod(method)}
                          className={`py-2.5 px-3 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
                            disabled
                              ? 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400'
                              : paymentMethod === method
                              ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-[#EFF6FF]'
                          }`}
                        >
                          {method === 'COD'
                            ? 'Cash On Delivery'
                            : method === 'bKash'
                            ? 'bKash (বিকাশ)'
                            : 'Nagad (নগদ)'}
                        </button>
                      );
                    })}
                  </div>

                  {paymentMethod !== 'COD' && (
                    <div className="p-4 rounded-2xl bg-[#EFF6FF] border border-blue-200 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs">
                          <span className="text-[#1D4ED8] font-bold block">
                            {paymentMethod} Send Money / Merchant Number:
                          </span>
                          <span className="font-mono text-base font-black text-[#0F172A]">
                            {merchantNumber}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(merchantNumber);
                            setCopiedMerchant(true);
                            setTimeout(() => setCopiedMerchant(false), 2500);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-white border border-blue-200 text-xs font-bold text-[#2563EB] flex items-center gap-1 cursor-pointer"
                        >
                          {copiedMerchant ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>কপি হয়েছে</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>নম্বর কপি</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            যে নম্বর থেকে টাকা পাঠিয়েছেন *
                          </label>
                          <input
                            type="tel"
                            required
                            value={senderNumber}
                            onChange={(e) => setSenderNumber(e.target.value)}
                            placeholder="01XXXXXXXXX"
                            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Transaction ID (TrxID) *
                          </label>
                          <input
                            type="text"
                            required
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                            placeholder="যেমন: BK9X84J921"
                            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono uppercase outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      অতিরিক্ত নির্দেশনা (ঐচ্ছিক)
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="ডেলিভারির আগে কল করবেন..."
                      className="w-full bg-[#F8FAFC] border border-slate-300 rounded-xl px-3.5 py-2 text-xs outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-slate-200 space-y-4 sticky top-4">
                  <h3 className="text-sm font-extrabold text-[#0F172A] font-display">
                    অর্ডার সারাংশ ({items.length} টি আইটেম)
                  </h3>

                  <div className="max-h-48 overflow-y-auto space-y-2.5 pr-1">
                    {items.map((item) => (
                      <div
                        key={`${item.productId}-${item.weight}`}
                        className="flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0 bg-white"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 truncate">{item.name}</p>
                            <p className="text-[11px] text-slate-500">
                              {item.weight} × {item.quantity}
                            </p>
                          </div>
                        </div>
                        <span className="font-bold text-slate-900 shrink-0 tabular-nums">
                          ৳{item.price * item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-200 space-y-2">
                    <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
                      <span>টেক প্রোমো / ডিসকাউন্ট কুপন</span>
                    </label>

                    {appliedCoupon ? (
                      <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-mono font-black text-[#2563EB]">
                            {appliedCoupon.code}
                          </span>
                          <span className="block text-[11px] text-blue-700 tabular-nums">
                            -৳{appliedCoupon.discount} ছাড়
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleClearCoupon}
                          className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
                        >
                          বাতিল
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value)}
                          placeholder="যেমন: KYNZO100 / TECH10"
                          className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs uppercase font-mono outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          className="px-3.5 py-2 rounded-xl bg-[#0B1120] text-white text-xs font-bold cursor-pointer hover:bg-[#2563EB] transition-colors"
                        >
                          Apply
                        </button>
                      </div>
                    )}

                    {couponError && (
                      <p className="text-[11px] font-semibold text-red-600">{couponError}</p>
                    )}
                    {couponSuccess && (
                      <p className="text-[11px] font-semibold text-[#2563EB]">
                        {couponSuccess}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal (গ্যাজেটের দাম):</span>
                      <span className="font-bold text-slate-900 tabular-nums">৳{subtotal}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span className="flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5 text-[#2563EB]" />
                        <span>Delivery Fee:</span>
                      </span>
                      <span className="font-bold text-slate-900 tabular-nums">
                        ৳{deliveryFee}
                      </span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-[#2563EB] font-bold">
                        <span>Coupon Discount:</span>
                        <span className="tabular-nums">-৳{discount}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-baseline pt-2 border-t border-slate-200">
                      <span className="text-sm font-extrabold text-[#0F172A]">Total Payable:</span>
                      <span className="text-xl font-black text-[#2563EB] font-display tabular-nums">
                        ৳{total}
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || items.length === 0}
                    className="w-full py-3.5 px-5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm shadow-lg shadow-blue-950/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? 'অর্ডার প্রসেস হচ্ছে...' : `Confirm Order · ৳${total}`}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
