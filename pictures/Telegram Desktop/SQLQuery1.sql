SELECT [MAT_ID],[QTY],[PRICE],[VALUE_DETAIL],[POS_ID],[SHIFT_ID],[PAYMENT_TYPE_NAME],[Completed_TS],[BUS_DATE] FROM [POSDB].[dbo].[RPT_BOR018] WHERE Completed_TS >= 'StartDate' AND Completed_TS <= 'ToDate';