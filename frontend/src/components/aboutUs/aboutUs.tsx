const AboutUs = () => {
  return (
    <section
      id="aboutUs"
      className="py-16 lg:py-20 bg-gray-950 relative overflow-hidden"
    >

      <div className="relative px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="mx-auto max-w-4xl text-center mb-14">
          <h2 className="mb-6 text-4xl md:text-5xl tracking-tight font-bold leading-tight gold-text">
            About{" "}
            <span className="bg-gradient-to-r from-red-700 via-red-600 to-yellow-500 bg-clip-text text-transparent ">
              PUPQuestC
            </span>
          </h2>

          <p className="mb-8 font-light text-gray-300 text-lg md:text-xl">
            PUPQuestC helps students and staff report, search, and claim lost items within the PUPQC campus.
          </p>
        </div>

        {/* CONTENT BOX */}
        <div className="mx-auto max-w-5xl">
          <div className="glass-card rounded-2xl p-8 md:p-12">

            <p className="font-light text-gray-300 text-lg md:text-xl leading-relaxed text-center">
              PUPQuestC is a campus lost and found system created for the PUPQC community. It helps students and staff report missing belongings, browse found items, and manage claims in one place. The goal is to make the lost and found process simpler, faster, and more organized for everyone.
            </p>

            {/* FEATURES */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-14">

              {/* CARD 1 */}
              <div className="text-center p-6 rounded-xl bg-gray-800/50 border border-gray-700/50 hover:border-gray-700/60 transition-colors duration-200">
                <div className="text-blue-400 text-4xl mb-4 ">
                  🔍
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Find Items
                </h3>
                <p className="text-gray-400 text-sm">
                  Browse reported items and search for belongings that may match your missing item.
                </p>
              </div>

              {/* CARD 2 */}
              <div className="text-center p-6 rounded-xl bg-gray-800/50 border border-gray-700/50 hover:border-gray-700/60 transition-colors duration-200">
                <div className="text-green-400 text-4xl mb-4 ">
                  🤝
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  PUPQC Community
                </h3>
                <p className="text-gray-400 text-sm">
                  Designed for students and staff to make lost and found reporting easier within the campus.
                </p>
              </div>

              {/* CARD 3 */}
              <div className="text-center p-6 rounded-xl bg-gray-800/50 border border-gray-700/50 hover:border-gray-700/60 transition-colors duration-200">
                <div className="text-yellow-400 text-4xl mb-4 ">
                  🛡️
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Safe Access
                </h3>
                <p className="text-gray-400 text-sm">
                  Accounts, reports, and item claims are managed securely within the system.
                </p>
              </div>

            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default AboutUs;