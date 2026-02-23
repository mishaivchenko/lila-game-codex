interface ChakraNotificationProps {
  text: string;
}

export const ChakraNotification = ({ text }: ChakraNotificationProps) => {
  return (
    <div className="rounded-xl border border-[#e2ccbe] bg-[#f4e6dc] px-3 py-2 text-sm text-[#5a473d]">
      {text}
    </div>
  );
};
