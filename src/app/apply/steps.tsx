"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin } from "lucide-react";
import {
  BRANCH_COUNTS,
  BRANDS,
  CALLBACK_CHANNELS,
  CALLBACK_SLOTS,
  CONTACT_POSITIONS,
  INSTALLMENT_STATUS,
  INTERESTS,
  PRICE_RANGES,
  PRODUCTS,
  PROVINCES,
  SHOP_TYPES,
  labelOf,
  labelsOf,
} from "@/lib/application/options";
import type { ApplicationData } from "@/lib/application/schema";
import {
  CheckboxGroup,
  ConsentCheckbox,
  Field,
  RadioGroup,
  SelectInput,
  TextInput,
} from "@/components/ui/form-fields";

export interface StepProps {
  data: ApplicationData;
  errors: Record<string, string>;
  update: <K extends keyof ApplicationData>(
    section: K,
    patch: Partial<ApplicationData[K]>,
  ) => void;
}

function SectionIntro({ children }: { children: React.ReactNode }) {
  return <p className="mb-8 max-w-[60ch] text-caption text-ink-48">{children}</p>;
}

/* ── 1. ข้อมูลร้าน ───────────────────────────────────────────── */

export function ShopStep({ data, errors, update }: StepProps) {
  const [geoStatus, setGeoStatus] = useState<"idle" | "loading" | "error">("idle");
  const shop = data.shop;
  const setAddress = (patch: Partial<ApplicationData["shop"]["address"]>) =>
    update("shop", { address: { ...shop.address, ...patch } });

  const shareLocation = () => {
    setGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        update("shop", {
          lat: position.coords.latitude.toFixed(6),
          lng: position.coords.longitude.toFixed(6),
        });
        setGeoStatus("idle");
      },
      () => setGeoStatus("error"),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  return (
    <div className="space-y-7">
      <SectionIntro>
        ข้อมูลร้านใช้เพื่อให้ทีมงานรู้ว่าร้านอยู่ที่ไหนและติดต่อได้อย่างไร
        ถ้ามีหลายสาขา ให้กรอกของสาขาหลักที่สะดวกให้ติดต่อที่สุด
      </SectionIntro>

      <Field id="shop-name" label="ชื่อร้านค้า" required error={errors["shop.name"]}>
        <TextInput
          id="shop-name"
          value={shop.name}
          onChange={(name) => update("shop", { name })}
          error={errors["shop.name"]}
          placeholder="เช่น ABC Mobile"
          autoComplete="organization"
        />
      </Field>

      <Field id="shop-type" label="ประเภทร้าน">
        <RadioGroup
          name="shop-type"
          value={shop.type}
          onChange={(type) => update("shop", { type })}
          options={SHOP_TYPES}
        />
        {shop.type === "other" ? (
          <div className="mt-3">
            <TextInput
              id="shop-type-other"
              value={shop.typeOther}
              onChange={(typeOther) => update("shop", { typeOther })}
              error={errors["shop.typeOther"]}
              placeholder="ระบุประเภทร้าน"
            />
            {errors["shop.typeOther"] ? (
              <p role="alert" className="mt-2 text-fine text-accent-ink">
                {errors["shop.typeOther"]}
              </p>
            ) : null}
          </div>
        ) : null}
      </Field>

      <Field
        id="branch-count"
        label="จำนวนสาขา"
        hint="สมัครใบเดียวในนามกิจการ ไม่ต้องแยกใบตามสาขา"
      >
        <RadioGroup
          name="branch-count"
          value={shop.branchCount}
          onChange={(branchCount) => update("shop", { branchCount })}
          options={BRANCH_COUNTS}
        />
      </Field>

      <fieldset>
        <legend className="text-caption font-semibold text-ink">
          ที่อยู่ร้าน<span className="pl-1 text-accent-ink">*</span>
        </legend>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Field id="addr-line1" label="เลขที่" required error={errors["shop.address.line1"]}>
            <TextInput
              id="addr-line1"
              value={shop.address.line1}
              onChange={(line1) => setAddress({ line1 })}
              error={errors["shop.address.line1"]}
            />
          </Field>
          <Field id="addr-road" label="ถนน">
            <TextInput
              id="addr-road"
              value={shop.address.road}
              onChange={(road) => setAddress({ road })}
            />
          </Field>
          <Field
            id="addr-sub"
            label="ตำบล / แขวง"
            required
            error={errors["shop.address.subDistrict"]}
          >
            <TextInput
              id="addr-sub"
              value={shop.address.subDistrict}
              onChange={(subDistrict) => setAddress({ subDistrict })}
              error={errors["shop.address.subDistrict"]}
            />
          </Field>
          <Field
            id="addr-district"
            label="อำเภอ / เขต"
            required
            error={errors["shop.address.district"]}
          >
            <TextInput
              id="addr-district"
              value={shop.address.district}
              onChange={(district) => setAddress({ district })}
              error={errors["shop.address.district"]}
            />
          </Field>
          <Field
            id="addr-province"
            label="จังหวัด"
            required
            error={errors["shop.address.province"]}
          >
            <SelectInput
              id="addr-province"
              value={shop.address.province}
              onChange={(province) => setAddress({ province })}
              options={PROVINCES}
              placeholder="เลือกจังหวัด"
              error={errors["shop.address.province"]}
            />
          </Field>
          <Field
            id="addr-post"
            label="รหัสไปรษณีย์"
            required
            error={errors["shop.address.postalCode"]}
          >
            <TextInput
              id="addr-post"
              value={shop.address.postalCode}
              onChange={(postalCode) => setAddress({ postalCode: postalCode.replace(/\D/g, "") })}
              error={errors["shop.address.postalCode"]}
              inputMode="numeric"
              maxLength={5}
            />
          </Field>
        </div>
      </fieldset>

      <Field
        id="geo"
        label="พิกัดร้าน"
        hint="ไม่บังคับ ช่วยให้ทีมขายหาร้านเจอ — กดตอนที่คุณอยู่ที่ร้าน เพราะระบบอ่านตำแหน่งของเครื่องคุณ ไม่ใช่ของร้าน"
      >
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={shareLocation}
            disabled={geoStatus === "loading"}
            className="inline-flex min-h-[52px] items-center gap-2 rounded-full bg-pearl px-6 text-body text-ink ring-1 ring-hairline ring-inset transition-colors hover:bg-parchment disabled:opacity-60"
          >
            <MapPin aria-hidden className="size-4" />
            {geoStatus === "loading" ? "กำลังอ่านตำแหน่ง…" : "แชร์ตำแหน่งร้าน"}
          </button>
          {shop.lat && shop.lng ? (
            <span className="text-caption text-ink-80">
              บันทึกแล้ว {shop.lat}, {shop.lng}
            </span>
          ) : null}
        </div>
        {geoStatus === "error" ? (
          <p role="alert" className="mt-2 text-fine text-accent-ink">
            อ่านตำแหน่งไม่สำเร็จ อาจเพราะเบราว์เซอร์ไม่ได้รับอนุญาต ข้ามขั้นนี้ไปก่อนได้
          </p>
        ) : null}
      </Field>
    </div>
  );
}

/* ── 2. ผู้ติดต่อ ─────────────────────────────────────────────── */

export function ContactStep({ data, errors, update }: StepProps) {
  const contact = data.contact;
  return (
    <div className="space-y-7">
      <SectionIntro>
        ทีมงานจะติดต่อกลับตามข้อมูลนี้ กรุณาใช้เบอร์ที่รับสายได้จริง
      </SectionIntro>

      <Field id="contact-name" label="ชื่อ–นามสกุล" required error={errors["contact.fullName"]}>
        <TextInput
          id="contact-name"
          value={contact.fullName}
          onChange={(fullName) => update("contact", { fullName })}
          error={errors["contact.fullName"]}
          autoComplete="name"
        />
      </Field>

      <Field id="contact-position" label="ตำแหน่ง">
        <RadioGroup
          name="contact-position"
          value={contact.position}
          onChange={(position) => update("contact", { position })}
          options={CONTACT_POSITIONS}
        />
        {contact.position === "other" ? (
          <div className="mt-3">
            <TextInput
              id="contact-position-other"
              value={contact.positionOther}
              onChange={(positionOther) => update("contact", { positionOther })}
              error={errors["contact.positionOther"]}
              placeholder="ระบุตำแหน่ง"
            />
            {errors["contact.positionOther"] ? (
              <p role="alert" className="mt-2 text-fine text-accent-ink">
                {errors["contact.positionOther"]}
              </p>
            ) : null}
          </div>
        ) : null}
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="contact-phone" label="เบอร์โทรศัพท์" required error={errors["contact.phone"]}>
          <TextInput
            id="contact-phone"
            value={contact.phone}
            onChange={(phone) => update("contact", { phone })}
            error={errors["contact.phone"]}
            inputMode="tel"
            autoComplete="tel"
            placeholder="0812345678"
          />
        </Field>
        <Field id="contact-line" label="LINE ID">
          <TextInput
            id="contact-line"
            value={contact.lineId}
            onChange={(lineId) => update("contact", { lineId })}
          />
        </Field>
      </div>

      <Field
        id="contact-email"
        label="อีเมล"
        hint="เติมจากบัญชี Google ให้แล้ว แก้ไขได้ถ้าต้องการใช้อีเมลอื่น"
        error={errors["contact.email"]}
      >
        <TextInput
          id="contact-email"
          type="email"
          value={contact.email}
          onChange={(email) => update("contact", { email })}
          error={errors["contact.email"]}
          autoComplete="email"
        />
      </Field>
    </div>
  );
}

/* ── 3. ข้อมูลธุรกิจ ─────────────────────────────────────────── */

export function BusinessStep({ data, errors, update }: StepProps) {
  const business = data.business;
  return (
    <div className="space-y-7">
      <SectionIntro>
        ข้อมูลนี้ช่วยให้บริษัทรู้ว่าร้านขายอะไร จะได้เตรียมเงื่อนไขที่ตรงกับร้านคุณ
      </SectionIntro>

      <Field
        id="products"
        label="ร้านจำหน่ายสินค้าอะไรบ้าง"
        required
        hint="เลือกได้หลายข้อ"
        error={errors["business.products"]}
      >
        <CheckboxGroup
          name="products"
          values={business.products}
          onChange={(products) => update("business", { products })}
          options={PRODUCTS}
          error={errors["business.products"]}
        />
        {business.products.includes("other") ? (
          <div className="mt-3">
            <TextInput
              id="product-other"
              value={business.productOther}
              onChange={(productOther) => update("business", { productOther })}
              error={errors["business.productOther"]}
              placeholder="ระบุสินค้าอื่น ๆ"
            />
            {errors["business.productOther"] ? (
              <p role="alert" className="mt-2 text-fine text-accent-ink">
                {errors["business.productOther"]}
              </p>
            ) : null}
          </div>
        ) : null}
      </Field>

      <Field id="brands" label="แบรนด์ที่จำหน่าย" hint="เลือกได้หลายข้อ">
        <CheckboxGroup
          name="brands"
          values={business.brands}
          onChange={(brands) => update("business", { brands })}
          options={BRANDS}
        />
        {business.brands.includes("other") ? (
          <div className="mt-3">
            <TextInput
              id="brand-other"
              value={business.brandOther}
              onChange={(brandOther) => update("business", { brandOther })}
              error={errors["business.brandOther"]}
              placeholder="ระบุแบรนด์อื่น ๆ"
            />
            {errors["business.brandOther"] ? (
              <p role="alert" className="mt-2 text-fine text-accent-ink">
                {errors["business.brandOther"]}
              </p>
            ) : null}
          </div>
        ) : null}
      </Field>
    </div>
  );
}

/* ── 4. ข้อมูลการขาย ─────────────────────────────────────────── */

export function SalesStep({ data, errors, update }: StepProps) {
  const sales = data.sales;
  return (
    <div className="space-y-7">
      <SectionIntro>
        ถามสั้น ๆ เพื่อประเมินว่าเงื่อนไขแบบไหนเหมาะกับร้านคุณ ไม่ต้องใช้ตัวเลขจริงจากบัญชี
      </SectionIntro>

      <Field id="price-range" label="ราคามือถือที่ร้านจำหน่ายโดยทั่วไป">
        <RadioGroup
          name="price-range"
          value={sales.priceRange}
          onChange={(priceRange) => update("sales", { priceRange })}
          options={PRICE_RANGES}
        />
      </Field>

      <Field id="installment" label="ปัจจุบันร้านมีบริการผ่อนหรือไฟแนนซ์หรือไม่">
        <RadioGroup
          name="installment"
          value={sales.installmentStatus}
          onChange={(installmentStatus) => update("sales", { installmentStatus })}
          options={INSTALLMENT_STATUS}
        />
        {sales.installmentStatus === "yes" ? (
          <div className="mt-3">
            <TextInput
              id="installment-providers"
              value={sales.installmentProviders}
              onChange={(installmentProviders) => update("sales", { installmentProviders })}
              error={errors["sales.installmentProviders"]}
              placeholder="ระบุชื่อผู้ให้บริการ เช่น A, B"
            />
            {errors["sales.installmentProviders"] ? (
              <p role="alert" className="mt-2 text-fine text-accent-ink">
                {errors["sales.installmentProviders"]}
              </p>
            ) : null}
          </div>
        ) : null}
      </Field>
    </div>
  );
}

/* ── 6. ความสนใจและการติดต่อกลับ ─────────────────────────────── */

export function InterestsStep({ data, errors, update }: StepProps) {
  const interests = data.interests;
  return (
    <div className="space-y-7">
      <SectionIntro>
        บอกเราว่าคุณสนใจเรื่องอะไร และสะดวกให้ติดต่อกลับทางไหน
        เราจะติดต่อตามช่วงเวลาที่คุณเลือก
      </SectionIntro>

      <Field id="reasons" label="ร้านสนใจเข้าร่วมในลักษณะใด" hint="เลือกได้หลายข้อ">
        <CheckboxGroup
          name="reasons"
          values={interests.reasons}
          onChange={(reasons) => update("interests", { reasons })}
          options={INTERESTS}
        />
        {interests.reasons.includes("other") ? (
          <div className="mt-3">
            <TextInput
              id="reason-other"
              value={interests.reasonOther}
              onChange={(reasonOther) => update("interests", { reasonOther })}
              error={errors["interests.reasonOther"]}
              placeholder="ระบุความสนใจอื่น ๆ"
            />
            {errors["interests.reasonOther"] ? (
              <p role="alert" className="mt-2 text-fine text-accent-ink">
                {errors["interests.reasonOther"]}
              </p>
            ) : null}
          </div>
        ) : null}
      </Field>

      <Field
        id="callback-channel"
        label="ต้องการให้เจ้าหน้าที่ติดต่อกลับทางใด"
        required
        error={errors["interests.callbackChannel"]}
      >
        <RadioGroup
          name="callback-channel"
          value={interests.callbackChannel}
          onChange={(callbackChannel) => update("interests", { callbackChannel })}
          options={CALLBACK_CHANNELS}
          error={errors["interests.callbackChannel"]}
        />
      </Field>

      <Field
        id="callback-slot"
        label="ช่วงเวลาที่สะดวก"
        required
        error={errors["interests.callbackSlot"]}
      >
        <RadioGroup
          name="callback-slot"
          value={interests.callbackSlot}
          onChange={(callbackSlot) => update("interests", { callbackSlot })}
          options={CALLBACK_SLOTS}
          error={errors["interests.callbackSlot"]}
        />
      </Field>
    </div>
  );
}

/* ── 7. ตรวจสอบและยืนยัน ─────────────────────────────────────── */

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-1 border-b border-hairline py-3 last:border-b-0">
      <dt className="w-full text-caption text-ink-48 sm:w-56">{label}</dt>
      <dd className="flex-1 text-caption text-ink">{value || "—"}</dd>
    </div>
  );
}

function SummaryBlock({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg bg-canvas p-6 ring-1 ring-hairline ring-inset">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-body font-semibold">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="min-h-[44px] px-2 text-caption text-accent-ink underline underline-offset-4"
        >
          แก้ไข
        </button>
      </div>
      <dl className="mt-2">{children}</dl>
    </section>
  );
}

export function ReviewStep({
  data,
  errors,
  update,
  goToStep,
  editing = false,
}: StepProps & { goToStep: (index: number) => void; editing?: boolean }) {
  const { shop, contact, business, sales, interests, consent } = data;
  const address = [
    shop.address.line1,
    shop.address.road && `ถนน${shop.address.road}`,
    shop.address.subDistrict,
    shop.address.district,
    shop.address.province,
    shop.address.postalCode,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="space-y-7">
      <SectionIntro>
        {editing
          ? "ตรวจดูอีกครั้งก่อนบันทึก กด “แก้ไข” เพื่อกลับไปแก้ในขั้นตอนนั้นได้"
          : "ตรวจดูอีกครั้งก่อนส่ง กด “แก้ไข” เพื่อกลับไปแก้ในขั้นตอนนั้นได้"}
      </SectionIntro>

      <div className="space-y-4">
        <SummaryBlock title="ข้อมูลร้าน" onEdit={() => goToStep(0)}>
          <SummaryRow label="ชื่อร้านค้า" value={shop.name} />
          <SummaryRow
            label="ประเภทร้าน"
            value={shop.type === "other" ? shop.typeOther : labelOf(SHOP_TYPES, shop.type)}
          />
          <SummaryRow label="จำนวนสาขา" value={labelOf(BRANCH_COUNTS, shop.branchCount)} />
          <SummaryRow label="ที่อยู่" value={address} />
          <SummaryRow
            label="พิกัด"
            value={shop.lat && shop.lng ? `${shop.lat}, ${shop.lng}` : "ไม่ได้ระบุ"}
          />
        </SummaryBlock>

        <SummaryBlock title="ผู้ติดต่อ" onEdit={() => goToStep(1)}>
          <SummaryRow label="ชื่อ–นามสกุล" value={contact.fullName} />
          <SummaryRow
            label="ตำแหน่ง"
            value={
              contact.position === "other"
                ? contact.positionOther
                : labelOf(CONTACT_POSITIONS, contact.position)
            }
          />
          <SummaryRow label="เบอร์โทรศัพท์" value={contact.phone} />
          <SummaryRow label="LINE ID" value={contact.lineId} />
          <SummaryRow label="อีเมล" value={contact.email} />
        </SummaryBlock>

        <SummaryBlock title="ข้อมูลธุรกิจ" onEdit={() => goToStep(2)}>
          <SummaryRow label="สินค้าที่จำหน่าย" value={labelsOf(PRODUCTS, business.products)} />
          {business.products.includes("other") ? (
            <SummaryRow label="สินค้าอื่น ๆ" value={business.productOther} />
          ) : null}
          <SummaryRow label="แบรนด์ที่จำหน่าย" value={labelsOf(BRANDS, business.brands)} />
          {business.brands.includes("other") ? (
            <SummaryRow label="แบรนด์อื่น ๆ" value={business.brandOther} />
          ) : null}
        </SummaryBlock>

        <SummaryBlock title="ข้อมูลการขาย" onEdit={() => goToStep(3)}>
          <SummaryRow label="ช่วงราคาที่ขาย" value={labelOf(PRICE_RANGES, sales.priceRange)} />
          <SummaryRow
            label="บริการผ่อน/ไฟแนนซ์"
            value={labelOf(INSTALLMENT_STATUS, sales.installmentStatus)}
          />
          {sales.installmentStatus === "yes" ? (
            <SummaryRow label="ผู้ให้บริการปัจจุบัน" value={sales.installmentProviders} />
          ) : null}
        </SummaryBlock>

        <SummaryBlock title="ความสนใจและการติดต่อกลับ" onEdit={() => goToStep(5)}>
          <SummaryRow label="สนใจเข้าร่วมเพราะ" value={labelsOf(INTERESTS, interests.reasons)} />
          {interests.reasons.includes("other") ? (
            <SummaryRow label="อื่น ๆ" value={interests.reasonOther} />
          ) : null}
          <SummaryRow
            label="ช่องทางติดต่อกลับ"
            value={labelOf(CALLBACK_CHANNELS, interests.callbackChannel)}
          />
          <SummaryRow
            label="ช่วงเวลาที่สะดวก"
            value={labelOf(CALLBACK_SLOTS, interests.callbackSlot)}
          />
        </SummaryBlock>
      </div>

      {/* ตอนแก้ไขไม่ขอความยินยอมซ้ำ หลักฐานที่เก็บไว้ตอนส่งครั้งแรกยังมีผลและห้ามถูกเขียนทับ
          การแก้ข้อมูลบันทึกไว้ใน audit trail แทน */}
      {editing ? (
        <p className="rounded-md bg-pearl p-4 text-caption text-ink-80 ring-1 ring-hairline ring-inset">
          การแก้ไขทุกครั้งจะถูกบันทึกไว้ในประวัติของใบสมัคร
          เพื่อให้เจ้าหน้าที่เห็นว่ามีอะไรเปลี่ยนไปบ้าง
          ความยินยอมที่ให้ไว้ตอนส่งครั้งแรกยังมีผลตามเดิม
        </p>
      ) : null}

      {/* สองข้อนี้เป็นคนละเรื่องกัน จึงต้องแยกกล่อง และห้ามติ๊กมาให้ล่วงหน้า */}
      <div className="space-y-3" hidden={editing}>
        <ConsentCheckbox
          id="consent-truthful"
          checked={consent.truthful}
          onChange={(truthful) => update("consent", { truthful })}
          error={errors["consent.truthful"]}
        >
          ข้าพเจ้ายืนยันว่าข้อมูลที่ให้ไว้เป็นความจริงและถูกต้อง
        </ConsentCheckbox>

        <ConsentCheckbox
          id="consent-pdpa"
          checked={consent.pdpa}
          onChange={(pdpa) => update("consent", { pdpa })}
          error={errors["consent.pdpa"]}
        >
          ข้าพเจ้ายินยอมให้บริษัทเก็บ ใช้ และประมวลผลข้อมูลที่ให้ไว้
          เพื่อวัตถุประสงค์ในการพิจารณาการสมัคร Partner และการติดต่อเกี่ยวกับการสมัคร
          ตามนโยบายความเป็นส่วนตัวของบริษัท{" "}
          <Link
            href="/privacy"
            target="_blank"
            className="text-accent-ink underline underline-offset-4"
          >
            อ่านนโยบายความเป็นส่วนตัว
          </Link>
        </ConsentCheckbox>
      </div>
    </div>
  );
}
