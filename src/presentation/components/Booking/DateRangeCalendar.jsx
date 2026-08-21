import { useMemo, useState } from 'react';
import { useTranslation } from '../../context/LanguageContext.jsx';
import './DateRangeCalendar.css';

function pad(n) { return String(n).padStart(2, '0'); }
function toKey(date) { return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`; }
function startOfDay(date) { const d = new Date(date); d.setHours(0, 0, 0, 0); return d; }

function bookedToKey(str) {
    // API returns "dd/MM/yyyy"
    const parts = String(str).split('/');
    if (parts.length !== 3) return null;
    const [d, m, y] = parts.map(Number);
    if (!d || !m || !y) return null;
    return `${y}-${pad(m)}-${pad(d)}`;
}

// A self-contained month-grid date-range picker: click a day to start a
// range, click another to finish it. Already-booked days are visibly
// blocked (not just discovered after the fact via a price-calc error),
// and picking a range that straddles a booked day is caught immediately
// with an inline message instead of a silent price API failure.
//
// specialPrices (optional): normalized [{ start, end, price }] ranges from
// GetChaletSpecialPricesUseCase/GetFlatSpecialPricesUseCase — "أسعار خاصة"
// in the app. The mobile app only marks these with a small dot; the web
// calendar has room to show the actual nightly price on each covered day
// plus a summary banner of the ranges.
//
// minNights (optional, default 1): the property's minimum stay (chalet's
// minDays field — see ChaletEntity/FAVORITES... no, Chalet.js). A range
// shorter than this is rejected right here in the picker (same inline
// warning mechanism as a booked day in range) instead of only surfacing as
// a submit-time error, so the constraint is visible before the user has
// filled out the whole form.
//
// hideLegend (optional, default false): the browse-page date filter (see
// FilterBar.jsx) isn't tied to one specific chalet — there's no real
// bookedDates/specialPrices data at that point, just "which dates do you
// want to check availability for" — so the selected/booked/available/
// special legend row underneath is meaningless noise there and gets hidden.
export default function DateRangeCalendar({ startDate, endDate, onSelect, bookedDates = [], minDate, specialPrices = [], minNights = 1, hideLegend = false }) {
    const { t, lang } = useTranslation();
    const today = startOfDay(minDate || new Date());
    const [viewDate, setViewDate] = useState(() => {
        const base = startDate ? new Date(startDate) : today;
        return new Date(base.getFullYear(), base.getMonth(), 1);
    });
    const [warning, setWarning] = useState('');

    const bookedSet = useMemo(() => {
        const set = new Set();
        bookedDates.forEach((d) => {
            const key = bookedToKey(d);
            if (key) set.add(key);
        });
        return set;
    }, [bookedDates]);

    const start = startDate ? startOfDay(new Date(startDate)) : null;
    const end = endDate ? startOfDay(new Date(endDate)) : null;

    const locale = lang === 'ar' ? 'ar' : 'en';
    const monthLabel = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(viewDate);
    const weekdayLabels = useMemo(() => {
        const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short' });
        // Week starting Sunday, 2023-01-01 was a Sunday.
        return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(2023, 0, 1 + i)));
    }, [locale]);
    const chipDateFmt = useMemo(() => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }), [locale]);

    // Lowest special price wins on days covered by more than one range.
    const specialByKey = useMemo(() => {
        const map = new Map();
        specialPrices.forEach(({ start, end, price }) => {
            if (!start || !end) return;
            const cur = startOfDay(start);
            const last = startOfDay(end);
            while (cur <= last) {
                const key = toKey(cur);
                if (!map.has(key) || map.get(key) > price) map.set(key, price);
                cur.setDate(cur.getDate() + 1);
            }
        });
        return map;
    }, [specialPrices]);

    const cells = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const offset = firstDay.getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const list = [];
        for (let i = 0; i < offset; i++) list.push(null);
        for (let d = 1; d <= daysInMonth; d++) list.push(new Date(year, month, d));
        return list;
    }, [viewDate]);

    const hasBookedBetween = (a, b) => {
        const cur = new Date(a);
        cur.setDate(cur.getDate() + 1);
        while (cur < b) {
            if (bookedSet.has(toKey(cur))) return true;
            cur.setDate(cur.getDate() + 1);
        }
        return false;
    };

    const handleDayClick = (date) => {
        setWarning('');
        const key = toKey(date);
        if (date < today || bookedSet.has(key)) return;

        if (!start || (start && end)) {
            onSelect(key, '');
            return;
        }
        if (date < start) {
            onSelect(key, '');
            return;
        }
        if (date.getTime() === start.getTime()) {
            if (minNights > 1) {
                setWarning(t('min_nights_required', { n: minNights }));
                return;
            }
            onSelect(key, key);
            return;
        }
        if (hasBookedBetween(start, date)) {
            setWarning(t('range_includes_booked'));
            onSelect(key, '');
            return;
        }
        const nights = Math.round((date.getTime() - start.getTime()) / 86400000);
        if (nights < minNights) {
            // Don't restart or clear the selection — keep the start date so
            // the user can just click a later day instead of having to
            // re-pick from scratch.
            setWarning(t('min_nights_required', { n: minNights }));
            return;
        }
        onSelect(startDate, key);
    };

    const goMonth = (delta) => {
        setViewDate((prev) => {
            const next = new Date(prev.getFullYear(), prev.getMonth() + delta, 1);
            const floor = new Date(today.getFullYear(), today.getMonth(), 1);
            return next < floor ? floor : next;
        });
    };

    const isPrevDisabled = viewDate.getFullYear() === today.getFullYear() && viewDate.getMonth() === today.getMonth();

    return (
        <div className="cal">
            <div className="cal-header">
                <button type="button" className="cal-nav" onClick={() => goMonth(-1)} disabled={isPrevDisabled} aria-label="Previous month">
                    <i className="fa-solid fa-chevron-left"></i>
                </button>
                <span className="cal-month-label">{monthLabel}</span>
                <button type="button" className="cal-nav" onClick={() => goMonth(1)} aria-label="Next month">
                    <i className="fa-solid fa-chevron-right"></i>
                </button>
            </div>

            {minNights > 1 && (
                <div className="cal-minnights-banner">
                    <i className="fa-solid fa-moon"></i>
                    <span>{t('min_nights_notice', { n: minNights })}</span>
                </div>
            )}

            {specialPrices.length > 0 && (
                <div className="cal-special-banner">
                    <i className="fa-solid fa-tag"></i>
                    <div>
                        <p>{t('special_prices_note')}</p>
                        <div className="cal-special-chips">
                            {specialPrices.map((sp, i) => (
                                <span key={i} className="cal-special-chip">
                                    {chipDateFmt.format(sp.start)} – {chipDateFmt.format(sp.end)} • {sp.price} {t('omr')}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="cal-weekdays">
                {weekdayLabels.map((w, i) => <span key={i}>{w}</span>)}
            </div>

            <div className="cal-grid">
                {cells.map((date, i) => {
                    if (!date) return <span key={i} className="cal-cell cal-blank"></span>;
                    const key = toKey(date);
                    const isPast = date < today;
                    const isBooked = bookedSet.has(key);
                    const isStart = start && date.getTime() === start.getTime();
                    const isEnd = end && date.getTime() === end.getTime();
                    const isInRange = start && end && date > start && date < end;
                    const isToday = date.getTime() === today.getTime();
                    const disabled = isPast || isBooked;
                    const specialPrice = !disabled ? specialByKey.get(key) : undefined;
                    const hasSpecial = specialPrice != null;

                    const cls = ['cal-cell', 'cal-day'];
                    if (disabled) cls.push('is-disabled');
                    if (isBooked) cls.push('is-booked');
                    if (isToday) cls.push('is-today');
                    if (isStart || isEnd) cls.push('is-selected');
                    if (isInRange) cls.push('is-in-range');
                    if (hasSpecial) cls.push('has-special');

                    return (
                        <button
                            key={i}
                            type="button"
                            className={cls.join(' ')}
                            disabled={disabled}
                            onClick={() => handleDayClick(date)}
                        >
                            <span className="cal-day-num">{date.getDate()}</span>
                            {hasSpecial && <span className="cal-day-price">{specialPrice}</span>}
                        </button>
                    );
                })}
            </div>

            {warning && <p className="cal-warning"><i className="fa-solid fa-circle-info"></i> {warning}</p>}

            {!hideLegend && (
                <div className="cal-legend">
                    <span><i className="cal-dot cal-dot-selected"></i> {t('cal_selected')}</span>
                    <span><i className="cal-dot cal-dot-booked"></i> {t('cal_booked')}</span>
                    <span><i className="cal-dot cal-dot-available"></i> {t('cal_available')}</span>
                    {specialPrices.length > 0 && (
                        <span><i className="cal-dot cal-dot-special"></i> {t('cal_special')}</span>
                    )}
                </div>
            )}
        </div>
    );
}
