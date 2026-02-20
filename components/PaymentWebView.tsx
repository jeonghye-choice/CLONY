import React, { useState } from 'react';
import { View, Modal, ActivityIndicator, Alert } from 'react-native';
import { WebView } from 'react-native-webview';

interface PaymentWebViewProps {
    visible: boolean;
    orderId: string;
    amount: number;
    orderName: string;
    onSuccess: (paymentKey: string, orderId: string, amount: number) => void;
    onFail: (error: string) => void;
    onClose: () => void;
}

// Toss Payments 테스트 클라이언트 키
const TOSS_CLIENT_KEY = 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq';

const PaymentWebView: React.FC<PaymentWebViewProps> = ({
    visible,
    orderId,
    amount,
    orderName,
    onSuccess,
    onFail,
    onClose,
}) => {
    const [loading, setLoading] = useState(true);

    // Generate success/fail URLs
    const successUrl = `https://clony-payment-success.com?orderId=${orderId}&amount=${amount}`;
    const failUrl = 'https://clony-payment-fail.com';

    // HTML for Toss Payments
    const paymentHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script src="https://js.tosspayments.com/v1/payment"></script>
      <style>
        body {
          margin: 0;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: #f9fafb;
        }
        .container {
          max-width: 500px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #00D182;
          margin-bottom: 10px;
        }
        .order-info {
          background: white;
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid #f3f4f6;
        }
        .info-row:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }
        .label {
          color: #6b7280;
          font-size: 14px;
        }
        .value {
          font-weight: 600;
          color: #111827;
        }
        .total {
          font-size: 20px;
          color: #00D182;
        }
        #payment-button {
          width: 100%;
          background: #00D182;
          color: white;
          border: none;
          border-radius: 12px;
          padding: 16px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 4px 6px rgba(0, 209, 130, 0.2);
        }
        #payment-button:active {
          transform: scale(0.98);
        }
        .loading {
          text-align: center;
          color: #6b7280;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Clony</div>
          <p style="color: #6b7280; margin: 0;">안전한 결제</p>
        </div>
        
        <div class="order-info">
          <div class="info-row">
            <span class="label">주문명</span>
            <span class="value">${orderName}</span>
          </div>
          <div class="info-row">
            <span class="label">주문번호</span>
            <span class="value">${orderId}</span>
          </div>
          <div class="info-row">
            <span class="label">결제금액</span>
            <span class="value total">${amount.toLocaleString()}원</span>
          </div>
        </div>

        <button id="payment-button">결제하기</button>
        <div class="loading" id="loading" style="display: none;">결제창을 여는 중...</div>
      </div>

      <script>
        const clientKey = '${TOSS_CLIENT_KEY}';
        const tossPayments = TossPayments(clientKey);

        const button = document.getElementById('payment-button');
        const loading = document.getElementById('loading');

        button.addEventListener('click', function() {
          button.style.display = 'none';
          loading.style.display = 'block';

          tossPayments.requestPayment('카드', {
            amount: ${amount},
            orderId: '${orderId}',
            orderName: '${orderName}',
            customerName: '클로니 고객',
            successUrl: '${successUrl}',
            failUrl: '${failUrl}',
          }).catch(function(error) {
            if (error.code === 'USER_CANCEL') {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'CANCEL',
                message: '사용자가 결제를 취소했습니다'
              }));
            } else {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'ERROR',
                message: error.message || '결제 중 오류가 발생했습니다'
              }));
            }
            button.style.display = 'block';
            loading.style.display = 'none';
          });
        });
      </script>
    </body>
    </html>
  `;

    const handleNavigationStateChange = (navState: any) => {
        const { url } = navState;

        // Check for success
        if (url.includes('clony-payment-success.com')) {
            const urlParams = new URLSearchParams(url.split('?')[1]);
            const paymentKey = urlParams.get('paymentKey');
            const orderIdParam = urlParams.get('orderId');
            const amountParam = urlParams.get('amount');

            if (paymentKey && orderIdParam && amountParam) {
                onSuccess(paymentKey, orderIdParam, parseInt(amountParam));
            } else {
                onFail('결제 정보를 확인할 수 없습니다');
            }
        }

        // Check for failure
        if (url.includes('clony-payment-fail.com')) {
            const urlParams = new URLSearchParams(url.split('?')[1]);
            const message = urlParams.get('message') || '결제에 실패했습니다';
            onFail(message);
        }
    };

    const handleMessage = (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);

            if (data.type === 'CANCEL') {
                onClose();
            } else if (data.type === 'ERROR') {
                onFail(data.message);
            }
        } catch (error) {
            console.error('Failed to parse message:', error);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-white">
                {loading && (
                    <View className="absolute top-0 left-0 right-0 bottom-0 items-center justify-center z-10 bg-white">
                        <ActivityIndicator size="large" color="#00D182" />
                    </View>
                )}
                <WebView
                    source={{ html: paymentHTML }}
                    onLoadEnd={() => setLoading(false)}
                    onNavigationStateChange={handleNavigationStateChange}
                    onMessage={handleMessage}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                />
            </View>
        </Modal>
    );
};

export default PaymentWebView;
