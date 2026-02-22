interface ChakraNotificationProps {
  text: string;
}

export const ChakraNotification = ({ text }: ChakraNotificationProps) => {
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
      {text}
    </div>
  );
};
