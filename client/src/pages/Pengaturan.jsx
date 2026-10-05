export default function Pengaturan() {
  return (
    <div>
      <h2 className="text-xl font-bold mb-1">Pengaturan</h2>
      <p className="text-sm text-gray-500 mb-6">Konfigurasi aplikasi</p>

      <div className="bg-white border border-gray-200 rounded-xl p-5 max-w-xl">
        <h3 className="font-semibold mb-2">Identitas Toko</h3>
        <p className="text-sm text-gray-500 mb-4">
          Nama & alamat toko yang tercetak di struk saat ini diatur langsung di template
          <code className="mx-1 bg-gray-100 px-1.5 py-0.5 rounded text-xs">
            server/src/templates/Template_Struk_Primaboga.docx
          </code>
          . Form pengaturan di sini bisa dikembangkan untuk mengubahnya tanpa edit file.
        </p>

        <h3 className="font-semibold mb-2 mt-6">Rencana Pengembangan</h3>
        <ul className="text-sm text-gray-500 list-disc list-inside space-y-1">
          <li>Multi User &amp; Login (Admin / Kasir)</li>
          <li>Hak Akses per role</li>
          <li>Backup &amp; Restore database lokal</li>
          <li>Sinkronisasi Cloud</li>
          <li>WhatsApp Reminder Cicilan</li>
          <li>Barcode Scanner</li>
          <li>Printer Thermal &amp; Dot Matrix langsung (ESC/POS)</li>
        </ul>
      </div>
    </div>
  );
}
